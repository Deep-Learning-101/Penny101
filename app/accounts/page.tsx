import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, ChevronRight } from "lucide-react";
import { getAccountsWithBalance } from "@/app/actions/accountsBalance";

// 強制動態渲染
export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const accountsWithBalance = await getAccountsWithBalance();

  // 分組：啟用和停用
  const activeAccounts = accountsWithBalance.filter((a) => a.isActive);
  const inactiveAccounts = accountsWithBalance.filter((a) => !a.isActive);

  const AccountCard = ({
    account,
  }: {
    account: {
      id: number;
      name: string;
      type: string;
      balance: string;
      transactionCount: number;
      isActive: boolean;
    };
  }) => {
    const balance = parseFloat(account.balance);
    const typeColor =
      account.type === "銀行"
        ? "blue"
        : account.type === "現金"
          ? "green"
          : "purple";

    return (
      <Link href={`/accounts/${account.id}`}>
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
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
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">帳戶總覽</h1>
        <p className="text-muted-foreground">查看所有帳戶餘額與交易明細</p>
      </div>

      {/* 啟用的帳戶 */}
      {activeAccounts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">啟用帳戶</h2>
          <div className="space-y-3">
            {activeAccounts.map((account) => (
              <AccountCard key={account.id} account={account} />
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
