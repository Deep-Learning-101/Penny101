"use client";

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

interface ReportChartsProps {
  yearlyTrend: YearlyTrendData[];
  expenseByCategory: ExpenseCategoryData[];
}

export function ReportCharts({ yearlyTrend, expenseByCategory }: ReportChartsProps) {
  return (
    <>
      {/* 收支趨勢折線圖 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>全年收支趨勢</CardTitle>
        </CardHeader>
        <CardContent>
          {!yearlyTrend || yearlyTrend.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              尚無收支趨勢資料
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

      {/* 支出分類圓餅圖 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>全年支出分類佔比</CardTitle>
        </CardHeader>
        <CardContent>
          {!expenseByCategory || expenseByCategory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              尚無支出記錄
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
