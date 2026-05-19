"use client";

import { Badge } from "@/components/ui/badge";

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
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        尚無交易記錄，點擊右下角按鈕新增第一筆記帳
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          {/* 左側：日期、分類、帳戶 */}
          <div className="flex flex-col gap-1">
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

          {/* 右側：金額 */}
          <div
            className={`text-xl font-bold ${
              transaction.type === "收入" ? "text-green-600" : "text-red-600"
            }`}
          >
            {transaction.type === "收入" ? "+" : "-"}NT$ {Number(transaction.amount).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
