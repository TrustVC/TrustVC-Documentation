# TrustVC Documentation

Official documentation site for [TrustVC](https://trustvc.io) — a comprehensive library for signing, verifying, and managing W3C Verifiable Credentials.

Built with [Docusaurus 3](https://docusaurus.io/) and styled with the TrustVC brand theme.

## Prerequisites

- **Node.js** `>= 22.0.0`
- **npm**

## Getting Started

### Install dependencies

```bash
npm install
```

### Run the dev server

```bash
npm start
```

The site will be available at [http://localhost:3000](http://localhost:3000). The dev server supports hot reload for both content and styling.

### Build for production

```bash
npm run build
```

Static files are generated in the `build/` directory.

### Preview the production build

```bash
npm run serve
```

## Project Structure

```
TrustVC-Documentation/
├── docs/                       # Markdown documentation pages
│   ├── getting-started.md      # SDK getting started guide
│   ├── tutorial/               # End-to-end tutorials
│   ├── how-tos/                # Task-oriented guides
│   ├── migration-guide/        # Version migration guides
│   ├── common-issues/          # Troubleshooting
│   └── glossary/               # Terminology reference
├── src/
│   ├── css/
│   │   ├── custom.css          # Docusaurus theme overrides (TrustVC brand)
│   │   └── styles.css          # Tailwind entry + font-face declarations
│   └── pages/
│       └── index.tsx           # Root redirect to /docs/getting-started
├── static/
│   ├── fonts/                  # Gilroy font files
│   ├── img/                    # Logos and favicon
│   └── docs/                   # Doc images
├── docusaurus.config.js        # Site configuration
├── sidebars.json               # Sidebar navigation structure
├── tailwind.config.js          # Tailwind theme (TrustVC colors)
└── postcss.config.js           # PostCSS + Tailwind pipeline
```

## Writing Documentation

Documentation pages are standard Markdown (`.md`) or MDX (`.mdx`) files under `docs/`. Each page supports:

- Standard Markdown syntax
- Frontmatter (`title`, `sidebar_position`, etc.)
- Code blocks with syntax highlighting (Prism)
- Docusaurus admonitions (`:::note`, `:::tip`, `:::warning`, `:::danger`, `:::info`)
- Blockquotes (styled as TrustVC callout boxes)

When adding a new page:

1. Create the Markdown file under the appropriate `docs/` subdirectory
2. Add the page's slug to `sidebars.json` in the correct category
3. Run `npm start` to preview

## Key Configuration

| File | Purpose |
|---|---|
| `docusaurus.config.js` | Site title, navbar, footer, URL, plugins |
| `sidebars.json` | Sidebar navigation structure |
| `src/css/custom.css` | Infima theme variables (colors, fonts, spacing) |
| `tailwind.config.js` | Tailwind color palette and content paths |
| `package.json` | Dependencies and build scripts |

## Contributing

1. Create a feature branch from `main`
2. Make your changes and test locally with `npm start`
3. Ensure the production build succeeds with `npm run build`
4. Submit a pull request

## Related Links

- [TrustVC SDK](https://github.com/TrustVC/trustvc) — the library this documentation covers
- [Docusaurus Documentation](https://docusaurus.io/docs) — framework reference

## License

Apache-2.0
