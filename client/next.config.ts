import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 배포를 위해 standalone 출력 사용
  output: 'standalone',
};

export default nextConfig;
