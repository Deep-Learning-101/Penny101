import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 啟用 standalone 模式（用於 Docker 部署）
  output: "standalone",

  // 圖片優化設定
  images: {
    unoptimized: true, // 在 Docker 環境中禁用圖片優化
  },

  // 忽略 TypeScript 和 ESLint 錯誤（加速建置）
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
