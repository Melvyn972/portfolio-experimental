import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three"],
  async headers() {
    return [
      {
        source: "/cv-melvyn-thierry-bellefond.pdf",
        headers: [
          {
            key: "Content-Disposition",
            value: 'attachment; filename="cv-melvyn-thierry-bellefond.pdf"',
          },
          { key: "Content-Type", value: "application/pdf" },
        ],
      },
    ];
  },
};

export default nextConfig;
