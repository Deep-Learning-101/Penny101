import { Suspense } from "react";
import { Dashboard } from "./components/Dashboard";
import { AddTransactionFAB } from "./components/AddTransactionFAB";

// 強制動態渲染，避免 Build 時連接資料庫
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* 儀表板內容 */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-muted-foreground">載入中...</div>
          </div>
        }
      >
        <Dashboard />
      </Suspense>

      {/* 懸浮新增按鈕 (FAB) */}
      <AddTransactionFAB />
    </div>
  );
}
