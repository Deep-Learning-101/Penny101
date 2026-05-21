import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, ChevronRight, TrendingUp, TrendingDown, ArrowUp, ArrowDown } from "lucide-react";
import { getAccountsWithBalance, getAccountsSummary } from "@/app/actions/accountsBalance";
import { AccountSortButtons } from "./components/AccountSortButtons";
import { RefreshBalanceButton } from "./components/RefreshBalanceButton";

// 強制動態渲染
export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const [accountsWithBalance, summary] = await Promise.all([
    getAccountsWithBalance(),
    getAccountsSummary(),
  ]);

  // 分組：啟用和停用
  const activeAccounts = accountsWithBalance.filter((a) => a.isActive);
  const inactiveAccounts = accountsWithBalance.filter((a) => !a.isActive);

  const AccountCard = ({
    account,
    index,
    total,
  }: {
    account: {
      id: number;
      name: string;
      type: string;
      balance: string;
      transactionCount: number;
      isActive: boolean;
    };
    index: number;
    total: number;
  }) => {
    const balance = parseFloat(account.balance);
    const typeColor =
      account.type === "銀行"
        ? "blue"
        : account.type === "現金"
          ? "green"
          : "purple";

    return (
      <Card className="hover:bg-muted/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <Link href={`/accounts/${account.id}`} className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{account.name}</span>
                <Badge
                  variant={
                    typeColor === "blue"
                      ? "default"
                      : typeColor === "green"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {account.type}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{account.transactionCount} 筆交易</span>
                <span
                  className={`text-lg font-bold ${
                    balance >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  NT$ {balance.toLocaleString()}
                </span>
              </div>
            </Link>
            <AccountSortButtons
              accountId={account.id}
              canMoveUp={index > 0}
              canMoveDown={index < total - 1}
              prevAccountId={index > 0 ? activeAccounts[index - 1].id : undefined}
              nextAccountId={index < total - 1 ? activeAccounts[index + 1].id : undefined}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  const netWorth = parseFloat(summary.netWorth);
  const liabilities = parseFloat(summary.totalLiabilities);

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">帳戶總覽</h1>
            <p className="text-muted-foreground">查看所有帳戶餘額與交易明細</p>
          </div>
          <RefreshBalanceButton />
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  總淨資產 (Net Worth)
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${netWorth >= 0 ? "text-green-600" : "text-red-600"}`}>
                NT$ {netWorth.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                所有帳戶餘額加總（含負債）
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  淨負債 (Total Liabilities)
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                NT$ {liabilities.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                負數帳戶餘額的絕對值加總
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 啟用的帳戶 */}
      {activeAccounts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">啟用帳戶</h2>
          <div className="space-y-3">
            {activeAccounts.map((account, index) => (
              <AccountCard
                key={account.id}
                account={account}
                index={index}
                total={activeAccounts.length}
              />
            ))}
          </div>
        </div>
      )}

      {/* 停用的帳戶 */}
      {inactiveAccounts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
            停用帳戶
          </h2>
          <div className="space-y-3 opacity-60">
            {inactiveAccounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        </div>
      )}

      {activeAccounts.length === 0 && inactiveAccounts.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            尚未建立任何帳戶，請前往設定頁面新增
          </CardContent>
        </Card>
      )}
    </div>
  );
}
