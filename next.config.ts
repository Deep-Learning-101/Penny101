import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 啟用 standalone 模式（用於 Docker 部署）
  output: "standalone",

  // 圖片優化設定
  images: {
    unoptimized: true, // 在 Docker 環境中禁用圖片優化
  },
};

export default nextConfig;
