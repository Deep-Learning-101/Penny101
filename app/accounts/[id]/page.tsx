import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wallet } from "lucide-react";
import { getAccountInfo, getAccountTransactions } from "@/app/actions/accountsBalance";
import Decimal from "decimal.js";
import { TimeRangeSelector } from "./components/TimeRangeSelector";

// 強制動態渲染
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string }>;
}

export default async function AccountDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { range } = await searchParams;
  const accountId = parseInt(id);

  if (isNaN(accountId)) {
    notFound();
  }

  // 驗證並設定時間範圍（預設 6 個月）
  const validRanges = ['3m', '6m', '1y', 'all'] as const;
  const timeRange = validRanges.includes(range as any) ? (range as typeof validRanges[number]) : '6m';

  const [account, transactions] = await Promise.all([
    getAccountInfo(accountId),
    getAccountTransactions(accountId, timeRange),
  ]);

  if (!account) {
    notFound();
  }

  // 計算餘額 = 初始餘額 + 收入 - 支出
  const initialBalance = new Decimal(account.initialBalance || "0");
  let balance = initialBalance;
  for (const t of transactions) {
    const amount = new Decimal(t.amount || "0");
    if (t.type === "收入") {
      balance = balance.plus(amount);
    } else if (t.type === "支出") {
      balance = balance.minus(amount);
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* 返回按鈕 */}
      <Link href="/accounts">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回帳戶列表
        </Button>
      </Link>

      {/* 帳戶資訊卡 */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Wallet className="h-6 w-6" />
            <CardTitle>{account.name}</CardTitle>
            <Badge
              variant={
                account.type === "銀行"
                  ? "default"
                  : account.type === "現金"
                    ? "secondary"
                    : "outline"
              }
            >
              {account.type}
            </Badge>
            {!account.isActive && (
              <Badge variant="destructive">已停用</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">初始餘額</p>
              <p className="text-lg font-semibold text-muted-foreground">
                NT$ {initialBalance.toNumber().toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">目前餘額</p>
              <p
                className={`text-2xl font-bold ${
                  balance.toNumber() >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                NT$ {balance.toNumber().toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">交易筆數</p>
              <p className="text-2xl font-bold">{transactions.length} 筆</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 交易明細列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>交易明細</CardTitle>
            <TimeRangeSelector currentRange={timeRange} accountId={accountId} />
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              此帳戶尚無交易記錄
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {transaction.displayDate}
                      </span>
                      <Badge
                        variant={
                          transaction.type === "收入" ? "default" : "destructive"
                        }
                      >
                        {transaction.type}
                      </Badge>
                    </div>
                    <div className="font-medium">{transaction.categoryName}</div>
                    {transaction.memo && (
                      <div className="text-sm text-muted-foreground">
                        {transaction.memo}
                      </div>
                    )}
                  </div>

                  <div
                    className={`text-xl font-bold ${
                      transaction.type === "收入"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.type === "收入" ? "+" : "-"}NT${" "}
                    {Number(transaction.amount).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
