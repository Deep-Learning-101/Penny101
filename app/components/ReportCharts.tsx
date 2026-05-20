"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

interface YearlyTrendData {
  month: string;
  income: string;
  expense: string;
}

interface ExpenseCategoryData {
  name: string;
  value: number;
  percentage: string;
}

interface TopExpenseData {
  name: string;
  value: number;
}

interface MonthlyBalanceData {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

interface ReportChartsProps {
  yearlyTrend: YearlyTrendData[];
  expenseByCategory: ExpenseCategoryData[];
  monthlyExpenseByCategory: ExpenseCategoryData[];
  monthlyTopExpenses: TopExpenseData[];
  yearlyMonthlyBalance: MonthlyBalanceData[];
  currentYear: number;
  currentMonth: number;
}

export function ReportCharts({
  yearlyTrend,
  expenseByCategory,
  monthlyExpenseByCategory,
  monthlyTopExpenses,
  yearlyMonthlyBalance,
  currentYear,
  currentMonth,
}: ReportChartsProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="py-8 text-center text-muted-foreground">載入圖表中...</div>
    );
  }

  return (
    <>
      {/* 收支趨勢折線圖 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>全年收支趨勢 ({currentYear})</CardTitle>
        </CardHeader>
        <CardContent>
          {!yearlyTrend || yearlyTrend.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              該年度尚無交易記錄
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={yearlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => `NT$ ${Number(value || 0).toLocaleString()}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  name="收入"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  name="支出"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 年度各月結餘趨勢 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>年度各月結餘趨勢 ({currentYear})</CardTitle>
        </CardHeader>
        <CardContent>
          {!yearlyMonthlyBalance || yearlyMonthlyBalance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              該年度尚無交易記錄
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearlyMonthlyBalance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => `NT$ ${Number(value || 0).toLocaleString()}`}
                />
                <Legend />
                <Bar dataKey="balance" name="結餘" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 本月支出分類圓餅圖 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>
            本月支出分類佔比 ({currentYear}/{currentMonth})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!monthlyExpenseByCategory || monthlyExpenseByCategory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              該月份尚無支出記錄
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={monthlyExpenseByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }: any) => `${name || "未知"} (${percentage || 0}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {monthlyExpenseByCategory.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => `NT$ ${Number(value || 0).toLocaleString()}`}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 本月支出排行榜 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>
            本月支出排行榜 Top 5 ({currentYear}/{currentMonth})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!monthlyTopExpenses || monthlyTopExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              該月份尚無支出記錄
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTopExpenses} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip
                  formatter={(value: any) => `NT$ ${Number(value || 0).toLocaleString()}`}
                />
                <Bar dataKey="value" name="支出金額" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 全年支出分類圓餅圖 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>全年支出分類佔比 ({currentYear})</CardTitle>
        </CardHeader>
        <CardContent>
          {!expenseByCategory || expenseByCategory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              該年度尚無支出記錄
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }: any) => `${name || "未知"} (${percentage || 0}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseByCategory.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => `NT$ ${Number(value || 0).toLocaleString()}`}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </>
  );
}
