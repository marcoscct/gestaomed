import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/gestaomed",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
