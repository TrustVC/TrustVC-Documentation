const siteConfig = {
  title: "TrustVC Documentation",
  tagline: "Documentation for TrustVC — Verifiable Credentials framework.",
  url: "https://docs.trustvc.io",
  baseUrl: "/",
  projectName: "TrustVC-Documentation",
  organizationName: "TrustVC",
  favicon: "img/favicon.svg",
  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          path: "./docs",
          sidebarPath: require.resolve("./sidebars.json"),
          sidebarCollapsible: true,
          routeBasePath: "docs",
        },
        theme: {
          customCss: [
            require.resolve("./src/css/custom.css"),
            require.resolve("./src/css/tailwind.css"),
          ],
        },
      },
    ],
  ],
  themeConfig: {
    colorMode: {
      defaultMode: "light",
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      logo: {
        alt: "TrustVC Logo",
        src: "img/logo/trustvc-logo-light.svg",
        srcDark: "img/logo/trustvc-logo-dark.svg",
      },
      items: [
        {
          to: "/docs/getting-started",
          position: "left",
          label: "Documentation",
        },
        {
          href: "https://github.com/TrustVC",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Documentation",
          items: [
            { label: "Getting Started", to: "/docs/getting-started" },
          ],
        },
        {
          title: "Community",
          items: [
            { label: "GitHub", href: "https://github.com/TrustVC" },
          ],
        },
      ],
      copyright: `Copyright \u00A9 ${new Date().getFullYear()} TrustVC`,
    },
    prism: {
      theme: require("prism-react-renderer").themes.nightOwl,
    },
  },
};

module.exports = siteConfig;
