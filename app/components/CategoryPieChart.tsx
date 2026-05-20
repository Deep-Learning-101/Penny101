"use client";

import { SmartPieChart } from "./SmartPieChart";

interface CategoryData {
  categoryId: number;
  categoryName: string;
  amount: string;
  percentage: string;
}

export function CategoryPieChart({ data }: { data: CategoryData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        本月尚無支出記錄
      </div>
    );
  }

  // 轉換資料格式給 SmartPieChart
  const chartData = data.map((item) => ({
    name: item.categoryName,
    value: Number(item.amount),
    percentage: item.percentage,
  }));

  return <SmartPieChart data={chartData} height={300} mergeThreshold={3.0} topN={6} />;
}
