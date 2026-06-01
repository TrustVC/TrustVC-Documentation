---
id: scaling
title: Scaling & High Availability
sidebar_label: Scaling & HA
sidebar_position: 8
---

# Scaling & High Availability

---

## Single Instance (Default)

By default, each chain runs in its own child process (`workerProcesses: true` in config). This means one chain crashing or losing its RPC connection does not affect the others. For most deployments a single container is sufficient.

```json
{
  "server": {
    "workerProcesses": true
  }
}
```

---

## Horizontal Scaling

To run multiple instances of the container in parallel — for redundancy or higher throughput — you must connect a database. The container uses a **distributed lease** mechanism (one active worker per chain at a time) to prevent duplicate event delivery when multiple instances are running.

```bash
# Required for horizontal scaling
DB_HOST=your-postgres-or-mysql-host
DB_LEASE_TTL_MS=30000   # how long a lease is held before another instance can take over
```

If the active instance crashes or loses its lease, another instance picks it up within `DB_LEASE_TTL_MS` milliseconds.

---

## Docker Compose — 2 Replicas

```yaml
services:
  trustvc-events:
    image: ghcr.io/trustvc/trustvc-chain-events:latest
    deploy:
      replicas: 2
    ports:
      - "8080-8081:8080"
    volumes:
      - ./config.json:/app/config.json:ro
    env_file:
      - .env
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: trustvcevents
      POSTGRES_USER: trustvc
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  pgdata:
```

**`.env`**

```bash
SIGNING_PRIVATE_KEY="your-base64-seed"

DB_HOST=postgres
DB_PORT=5432
DB_NAME=trustvcevents
DB_USER=trustvc
DB_PASSWORD=secret
DB_LEASE_TTL_MS=30000
```

---

## AWS ECS — Fargate

For production deployments on AWS, run the container as a Fargate service. The task definition below mirrors the Docker run command.

**Task definition (excerpt)**

```json
{
  "family": "trustvc-chain-events",
  "containerDefinitions": [
    {
      "name": "trustvc-chain-events",
      "image": "ghcr.io/trustvc/trustvc-chain-events:latest",
      "portMappings": [
        { "containerPort": 8080, "protocol": "tcp" }
      ],
      "mountPoints": [
        {
          "sourceVolume": "config",
          "containerPath": "/app/config.json",
          "readOnly": true
        }
      ],
      "environment": [
        { "name": "DB_HOST", "value": "your-rds-endpoint" },
        { "name": "DB_NAME", "value": "trustvcevents" },
        { "name": "DB_USER", "value": "trustvc" },
        { "name": "DB_LEASE_TTL_MS", "value": "30000" }
      ],
      "secrets": [
        {
          "name": "SIGNING_PRIVATE_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:trustvc/signing-key"
        },
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:trustvc/db-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/trustvc-chain-events",
          "awslogs-region": "ap-southeast-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

:::tip `config.json` on ECS
Mount `config.json` from an S3 object using an init container, or bake a non-secret config into a custom image layer. Keep secrets in AWS Secrets Manager and inject them as environment variables as shown above.
:::

---

## Health Check Integration

All orchestrators (ECS, Kubernetes, Docker Compose) can use the `/health` endpoint to determine instance readiness:

```json
{
  "healthCheck": {
    "command": ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"],
    "interval": 30,
    "timeout": 5,
    "retries": 3,
    "startPeriod": 15
  }
}
```

| `/health` response | Meaning |
|---|---|
| `{"status":"ok"}` | All chains connected |
| `{"status":"starting"}` | Container is still connecting to one or more chains |
| `{"status":"degraded"}` | At least one chain has permanently failed — restart the container |
