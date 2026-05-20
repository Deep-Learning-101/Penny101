"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, AlertCircle } from "lucide-react";
import { exportTransactionsCSV, importTransactionsCSV } from "@/app/actions/backup";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function BackupRestore() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
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
          text: `成功匯入 ${result.importedCount} 筆交易記錄！`,
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
            <li>匯出的 CSV 包含所有交易記錄</li>
            <li>匯入時會自動驗證帳戶和分類是否存在</li>
            <li>匯入不會刪除現有資料，只會新增記錄</li>
            <li>CSV 格式：id, transactionDate, amount, type, accountId, categoryId, memo</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
