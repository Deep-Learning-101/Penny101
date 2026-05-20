"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Trash2 } from "lucide-react";
import { deleteTransaction } from "@/app/actions/transactions";

interface Transaction {
  id: number;
  transactionDate: string;
  displayDate: string;
  amount: string;
  type: "收入" | "支出";
  memo: string;
  accountName: string;
  categoryName: string;
}

export function RecentTransactionsList({ transactions }: { transactions: Transaction[] }) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        尚無交易記錄，點擊右下角按鈕新增第一筆記帳
      </div>
    );
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const result = await deleteTransaction(id);
      if (!result.success) {
        alert(result.error || "刪除失敗");
      }
    } catch (error) {
      alert("刪除失敗，請稍後再試");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-2">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          {/* 左側：日期、分類、帳戶 */}
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {transaction.displayDate}
              </span>
              <Badge variant={transaction.type === "收入" ? "default" : "destructive"}>
                {transaction.type}
              </Badge>
            </div>
            <div className="font-medium">{transaction.categoryName}</div>
            <div className="text-sm text-muted-foreground">
              {transaction.accountName}
              {transaction.memo && ` · ${transaction.memo}`}
            </div>
          </div>

          {/* 中間：金額 */}
          <div
            className={`text-xl font-bold mr-4 ${
              transaction.type === "收入" ? "text-green-600" : "text-red-600"
            }`}
          >
            {transaction.type === "收入" ? "+" : "-"}NT$ {Number(transaction.amount).toLocaleString()}
          </div>

          {/* 右側：刪除按鈕 */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={deletingId === transaction.id}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>確認刪除</AlertDialogTitle>
                <AlertDialogDescription>
                  確定要刪除這筆交易記錄嗎？此操作無法復原。
                  <div className="mt-2 p-2 bg-muted rounded text-sm">
                    <div>類別：{transaction.categoryName}</div>
                    <div>金額：NT$ {Number(transaction.amount).toLocaleString()}</div>
                    <div>日期：{transaction.displayDate}</div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(transaction.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  確認刪除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}
    </div>
  );
}
