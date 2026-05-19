"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DailyData {
  date: string;
  day: string;
  amount: string;
}

export function DailyTrendChart({ data }: { data: DailyData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        本月尚無支出記錄
      </div>
    );
  }

  // 轉換資料格式給 recharts
  const chartData = data.map((item) => ({
    day: item.day,
    amount: Number(item.amount),
    date: item.date,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip
          formatter={(value: number) => `NT$ ${value.toLocaleString()}`}
          labelFormatter={(label) => `${label} 日`}
        />
        <Bar dataKey="amount" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  );
}
