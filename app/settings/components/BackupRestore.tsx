"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, AlertCircle, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { exportTransactionsCSV, importTransactionsCSV, clearAllTransactions } from "@/app/actions/backup";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function BackupRestore() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);
    try {
      const result = await exportTransactionsCSV();
      if (result.success && result.data) {
        // 建立下載連結
        const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.filename || "transactions.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setMessage({ type: "success", text: "匯出成功！" });
      } else {
        setMessage({ type: "error", text: result.error || "匯出失敗" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "匯出失敗，請稍後再試" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setMessage(null);

    try {
      const text = await file.text();
      const result = await importTransactionsCSV(text);

      if (result.success) {
        setMessage({
          type: "success",
          text: result.message || `成功匯入 ${result.importedCount} 筆交易記錄！`,
        });
      } else {
        setMessage({ type: "error", text: result.error || "匯入失敗" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "匯入失敗，請確認檔案格式" });
    } finally {
      setIsImporting(false);
      // 重置 input
      event.target.value = "";
    }
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    setMessage(null);

    try {
      const result = await clearAllTransactions();

      if (result.success) {
        setMessage({
          type: "success",
          text: "所有交易記錄已清空！",
        });
      } else {
        setMessage({ type: "error", text: result.error || "清空失敗" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "清空失敗，請稍後再試" });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>資料備份與還原</CardTitle>
        <CardDescription>
          匯出交易記錄為 CSV 檔案，或從 CSV 檔案匯入資料
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="whitespace-pre-line">
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          {/* 匯出按鈕 */}
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "匯出中..." : "匯出 CSV"}
          </Button>

          {/* 匯入按鈕 */}
          <Button
            onClick={() => document.getElementById("csv-upload")?.click()}
            disabled={isImporting}
            variant="outline"
            className="flex-1"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isImporting ? "匯入中..." : "匯入 CSV"}
          </Button>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleImport}
            className="hidden"
          />
        </div>

        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>注意事項：</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>匯出的 CSV 包含所有交易記錄（使用帳戶和分類名稱）</li>
            <li>匯入時會自動創建不存在的帳戶和分類</li>
            <li>匯入不會刪除現有資料，只會新增記錄</li>
            <li>支援外部記帳軟體 CSV 格式自動辨識</li>
          </ul>
        </div>

        {/* 危險操作區 */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold text-destructive mb-2">危險操作</h3>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={isClearing}
                className="w-full sm:w-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isClearing ? "清空中..." : "清空所有交易記錄"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive">
                  ⚠️ 確認清空所有資料
                </AlertDialogTitle>
                <AlertDialogDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">此操作將永久刪除所有交易記錄！</p>
                    <p>
                      這個操作無法復原。建議在清空前先匯出 CSV 備份。
                    </p>
                    <p className="text-destructive">
                      確定要清空所有交易記錄嗎？
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearAll}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  確認清空
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
