"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recalculateAllBalances } from "@/app/actions/accounts";
import { useState } from "react";

export function RefreshBalanceButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRefresh = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const result = await recalculateAllBalances();
      if (result.success) {
        setMessage(result.message || "刷新成功");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(result.error || "刷新失敗");
      }
    } catch (error) {
      console.error("Refresh failed:", error);
      setMessage("刷新失敗");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isLoading}
        title="同步刷新所有帳戶餘額"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
        刷新餘額
      </Button>
    </div>
  );
}
