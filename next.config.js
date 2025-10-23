const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next-dev',
  eslint: {
    // Workaround: Skip ESLint at build time due to Next + ESLint flat-config option mismatch (useEslintrc/extensions)
    // Lint remains enforced via pre-commit/pre-push and CI scripts.
    ignoreDuringBuilds: true,
  },
  // Note: Use process.env.MOCK_MODE=1 in CI/build to avoid external Redis/network during compilation.
  // Exclude backup directories from compilation
  webpack: config => {
    config.module.rules.push({
      test: /.*-backup\/.*$/,
      use: 'null-loader',
    });
    return config;
  },
  async redirects() {
    return [
      // No redirects - direct navigation to dashboard
    ];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
          // Allow clipboard-write where applicable (helps in real browsers)
          {
            key: 'Permissions-Policy',
            value: 'clipboard-write=(self "http://localhost")',
          },
        ],
      },
      // Soften chunk staleness: allow revalidation while serving cached assets
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:all*(js|css)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
