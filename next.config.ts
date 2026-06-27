import type { NextConfig } from "next";

// Allow the Circles connector iframe (served from *.gnosis.io) to be embedded.
// We only constrain frame-src; other directives are intentionally left
// unrestricted so Next.js dev tooling keeps working.
const csp = ["frame-src 'self' https://*.gnosis.io"].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
