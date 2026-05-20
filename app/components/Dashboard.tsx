import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { getDashboardStats, getMonthlyCategoryPie, getDailyTrend, getRecentTransactions } from "@/app/actions/finance";
import { CategoryPieChart } from "./CategoryPieChart";
import { DailyTrendChart } from "./DailyTrendChart";
import { RecentTransactionsList } from "./RecentTransactionsList";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function Dashboard() {
  // 取得當前年月（台灣時區）
  const now = dayjs().tz("Asia/Taipei");
  const year = now.year();
  const month = now.month() + 1; // dayjs 的 month 是 0-11

  // 載入所有資料
  const [stats, categoryPie, dailyTrend, recentTransactions] = await Promise.all([
    getDashboardStats(year, month),
    getMonthlyCategoryPie(year, month),
    getDailyTrend(year, month),
    getRecentTransactions(15),
  ]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* 頁首 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {year} 年 {month} 月財務儀表板
          </h1>
          <p className="text-muted-foreground">
            {now.format("YYYY-MM-DD dddd")}
          </p>
        </div>
        <Link href="/settings">
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            設定
          </Button>
        </Link>
      </div>

      {/* 三大數據卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* 總收入 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              本月收入
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              NT$ {Number(stats.totalIncome).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {/* 總支出 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              本月支出
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              NT$ {Number(stats.totalExpense).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {/* 總資產 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              總資產
            </CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${
                Number(stats.totalAssets) >= 0 ? "text-blue-600" : "text-orange-600"
              }`}
            >
              NT$ {Number(stats.totalAssets).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              所有帳戶餘額總和
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 圖表區塊 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 分類圓餅圖 */}
        <Card>
          <CardHeader>
            <CardTitle>支出分類統計</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={categoryPie} />
          </CardContent>
        </Card>

        {/* 日支出長條圖 */}
        <Card>
          <CardHeader>
            <CardTitle>每日支出趨勢</CardTitle>
          </CardHeader>
          <CardContent>
            <DailyTrendChart data={dailyTrend} />
          </CardContent>
        </Card>
      </div>

      {/* 近期明細列表 */}
      <Card>
        <CardHeader>
          <CardTitle>近期交易明細</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentTransactionsList transactions={recentTransactions} />
        </CardContent>
      </Card>
    </div>
  );
}
