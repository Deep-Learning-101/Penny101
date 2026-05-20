import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, Calendar } from "lucide-react";
import {
  getMonthSummary,
  getYearSummary,
  getYearlyTrend,
  getYearlyExpenseByCategory,
} from "@/app/actions/reports";
import { ReportCharts } from "@/app/components/ReportCharts";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

// 強制動態渲染
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const now = dayjs().tz("Asia/Taipei");
  const year = now.year();
  const month = now.month() + 1;

  // 載入所有資料
  const [monthSummary, yearSummary, yearlyTrend, expenseByCategory] =
    await Promise.all([
      getMonthSummary(year, month),
      getYearSummary(year),
      getYearlyTrend(year),
      getYearlyExpenseByCategory(year),
    ]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* 頁首 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">財務報表</h1>
        <p className="text-muted-foreground">
          {year} 年度財務彙整與分析
        </p>
      </div>

      {/* 本月總結 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          本月總結 ({year}/{month})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本月收入</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                NT$ {Number(monthSummary.totalIncome).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本月支出</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                NT$ {Number(monthSummary.totalExpense).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本月淨值</CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  Number(monthSummary.netWorth) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                NT$ {Number(monthSummary.netWorth).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本月筆數</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {monthSummary.transactionCount} 筆
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 本年總結 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          本年總結 ({year})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">全年收入</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                NT$ {Number(yearSummary.totalIncome).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">全年支出</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                NT$ {Number(yearSummary.totalExpense).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">全年淨值</CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  Number(yearSummary.netWorth) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                NT$ {Number(yearSummary.netWorth).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">全年筆數</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {yearSummary.transactionCount} 筆
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 圖表區域 - 使用 Client Component */}
      <ReportCharts
        yearlyTrend={yearlyTrend}
        expenseByCategory={expenseByCategory}
      />
    </div>
  );
}
