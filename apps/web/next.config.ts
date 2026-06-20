import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com"
      }
    ]
  },

  async headers() {
    const securityHeaders = [
      // Prevent site from being embedded in iframes (clickjacking)
      { key: "X-Frame-Options", value: "DENY" },
      // Prevent MIME-type sniffing
      { key: "X-Content-Type-Options", value: "nosniff" },
      // Limit referrer information sent to other sites
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // Disable browser features not needed
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      // Force HTTPS for 1 year
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      // Content security policy
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self' data: https:",
          "connect-src 'self' https:",
          "frame-ancestors 'none'"
        ].join("; ")
      }
    ];
    return [
      { source: "/", headers: securityHeaders },
      { source: "/:path*", headers: securityHeaders }
    ];
  }
};

export default nextConfig;
