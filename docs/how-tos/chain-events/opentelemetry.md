---
id: opentelemetry
title: OpenTelemetry
sidebar_label: OpenTelemetry
sidebar_position: 7
---

# OpenTelemetry

`trustvc-chain-events` can export traces and metrics to any [OpenTelemetry](https://opentelemetry.io/)-compatible backend. Point it at your existing OTLP endpoint using environment variables — no changes to `config.json` are required.

When `OTEL_ENABLED` is not set, all telemetry operations are no-ops with zero overhead.

---

## Configuration

Add these to your `.env`:

```bash
OTEL_ENABLED=true
OTEL_SERVICE_NAME=trustvc-chain-events
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-otlp-endpoint
OTEL_EXPORTER_OTLP_METRICS_DEFAULT_HISTOGRAM_AGGREGATION=explicit_bucket_histogram
| `OTEL_EXPORTER_OTLP_HEADERS` | — | Auth headers required by your backend (see examples below) |
| `OTEL_INSTANCE_ID` | `<hostname>-<pid>` | Custom instance identifier shown in metrics labels |
| `OTEL_EXPORTER_OTLP_METRICS_DEFAULT_HISTOGRAM_AGGREGATION` | — | Set to `explicit_bucket_histogram` for Prometheus-compatible histograms |

---

## Backend Examples

### Grafana Cloud

```bash
OTEL_ENABLED=true
OTEL_SERVICE_NAME=trustvc-chain-events
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway-prod-us-central-0.grafana.net/otlp
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <base64(instanceId:apiKey)>
OTEL_EXPORTER_OTLP_METRICS_DEFAULT_HISTOGRAM_AGGREGATION=explicit_bucket_histogram
```

### Datadog

```bash
OTEL_ENABLED=true
OTEL_SERVICE_NAME=trustvc-chain-events
OTEL_EXPORTER_OTLP_ENDPOINT=https://api.datadoghq.com/api/intake/otlp/v1/traces
OTEL_EXPORTER_OTLP_HEADERS=DD-API-KEY=<your-datadog-api-key>
```

### New Relic

```bash
OTEL_ENABLED=true
OTEL_SERVICE_NAME=trustvc-chain-events
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp.nr-data.net
OTEL_EXPORTER_OTLP_HEADERS=api-key=<your-new-relic-license-key>
OTEL_EXPORTER_OTLP_METRICS_DEFAULT_HISTOGRAM_AGGREGATION=explicit_bucket_histogram
```

### Self-hosted OTLP Collector

```bash
OTEL_ENABLED=true
OTEL_SERVICE_NAME=trustvc-chain-events
OTEL_EXPORTER_OTLP_ENDPOINT=http://your-collector-host:4318
```

---

## Emitted Metrics

Metrics are exported on a 15-second interval. Prometheus-compatible backends receive them with dots replaced by underscores (e.g. `trustvc.instance.health` → `trustvc_instance_health`).

### Instance Metrics

| Metric | Type | Description |
|---|---|---|
| `trustvc.instance.health` | Gauge | `1` = ok/starting, `0` = degraded (at least one chain permanently failed) |
| `trustvc.instance.uptime_seconds` | Gauge | Process uptime in seconds |
| `trustvc.instance.active_chains` | Gauge | Number of chains currently running |
| `trustvc.instance.active_workers` | Gauge | Active child worker processes (`0` when `workerProcesses: false`) |
| `trustvc.instance.total_escrows` | Gauge | Total active TitleEscrow subscriptions across all chains |

### Chain Metrics

Labels: `chain`, `transport`

| Metric | Type | Description |
|---|---|---|
| `trustvc.chain.connected` | Gauge | `1` = RPC connected, `0` = not connected |
| `trustvc.chain.last_seen_block` | Gauge | Latest block number observed |
| `trustvc.chain.active_escrows` | Gauge | Active TitleEscrow subscriptions on this chain |
| `trustvc.chain.reconnect_attempts` | Gauge | Cumulative RPC reconnection attempts |
| `trustvc.chain.events_received` | Counter | On-chain ETR events detected — labels: `chain`, `event_type` |
| `trustvc.chain.state_changes` | Counter | RPC provider state transitions — labels: `chain`, `from_status`, `to_status` |
| `trustvc.rpc.connects` | Counter | Successful RPC connections — labels: `chain`, `transport` |
| `trustvc.rpc.disconnects` | Counter | RPC disconnections — labels: `chain` |

### Webhook Metrics

| Metric | Type | Description |
|---|---|---|
| `trustvc.webhook.delivered` | Counter | Successful deliveries — label: `event_type` |
| `trustvc.webhook.failed` | Counter | Deliveries failed after all retries or dropped (queue full) — label: `event_type` |
| `trustvc.webhook.delivery_duration_ms` | Histogram | End-to-end delivery duration including retries — labels: `event_type`, `success` |
| `trustvc.webhook.queue_depth` | Gauge | Events currently waiting in the delivery queue |

---

## Emitted Traces

| Span | Description | Attributes |
|---|---|---|
| `deliver {event.type}` | Top-level span for a webhook delivery attempt | `event.id`, `event.type`, `event.source`, `webhook.url`, `delivery.attempts` |
| `webhook attempt {n}` | Child span for each individual retry | `http.attempt`, `http.url`, `http.status_code` |
| `chain.status_changed` | Emitted when the RPC provider state changes | `chain`, `transport`, `from_status`, `to_status`, `instance` |

---

## Grafana Dashboards

Two pre-built Grafana dashboards are available. Both use a Prometheus data source and can be imported directly into your Grafana instance.

**To import either dashboard:**

1. In Grafana, go to **Dashboards → Import**
2. Upload the downloaded JSON file
3. Select your Prometheus data source when prompted
4. Click **Import**

---

### Dashboard 1 — Webhook Events

Focused on day-to-day operational health: is my webhook delivering events? How fast? Are chains connected and tracking escrows?

<a href="/docs/chain-events/grafana-webhook-events.json" download="trustvc-grafana-webhook-events.json" className="button button--primary button--sm">Download Webhook Events Dashboard</a>

<br/><br/>

| Section | Panels |
|---|---|
| **Overview** | Uptime, chains connected, active escrows, total delivered, total failed, queue depth |
| **Webhook Delivery** | Delivery rate per minute, p50/p95/p99 delivery duration, queue depth over time |
| **Chain Status** | Chain status table, active escrows per chain, latest block per chain, escrow replay duration (from traces) |
| **On-Chain Events** | Events detected by type per minute |

---

### Dashboard 2 — Fleet & Chain Health

Focused on infrastructure health across multiple instances: useful when running more than one container in a high-availability setup. Shows which instances are healthy, which chains are connected, and how state is distributed across the fleet.

<a href="/docs/chain-events/grafana-fleet-health.json" download="trustvc-grafana-fleet-health.json" className="button button--primary button--sm">Download Fleet & Chain Health Dashboard</a>

<br/><br/>

| Section | Panels |
|---|---|
| **Fleet Overview** | Active instances, healthy instances, degraded instances, total active chains, total escrows, active worker processes |
| **Instance Health** | Instance status per host, instance uptime |
| **Chain Connectivity** | RPC connection status per chain, reconnect attempts, state transition rate, state transition counts |
| **Chain Activity** | Active escrows per chain, last seen block per chain |
