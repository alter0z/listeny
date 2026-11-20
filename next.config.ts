import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/listeny',
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
