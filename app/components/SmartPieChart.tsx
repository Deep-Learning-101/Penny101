"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface ChartDataItem {
  name: string;
  value: number;
  percentage: string;
}

interface SmartPieChartProps {
  data: ChartDataItem[];
  height?: number;
  mergeThreshold?: number; // 合併閾值（百分比），預設 5%
}

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#64748b", // slate (for "其他")
];

// 自訂標籤渲染：只有佔比 >= 閾值的才顯示標籤
const renderCustomLabel = (mergeThreshold: number) => ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percentage,
}: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // 只顯示佔比 >= 閾值的標籤
  if (parseFloat(percentage) < mergeThreshold) {
    return null;
  }

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs font-semibold"
    >
      {`${percentage}%`}
    </text>
  );
};

// 自訂 Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
        <p className="font-semibold text-sm mb-1">{data.name}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          金額: NT$ {data.value.toLocaleString()}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          佔比: {data.percentage}%
        </p>
        {data.isOthers && data.details && (
          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">包含：</p>
            {data.details.map((detail: string, idx: number) => (
              <p key={idx} className="text-xs text-slate-600 dark:text-slate-400">
                {detail}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function SmartPieChart({ data, height = 300, mergeThreshold = 5.0 }: SmartPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        尚無資料
      </div>
    );
  }

  // 分離主要分類和小分類
  const majorCategories: ChartDataItem[] = [];
  const minorCategories: ChartDataItem[] = [];

  data.forEach((item) => {
    if (parseFloat(item.percentage) >= mergeThreshold) {
      majorCategories.push(item);
    } else {
      minorCategories.push(item);
    }
  });

  // 計算「其他」分類的總和
  let othersTotal = 0;
  let othersPercentage = 0;
  const othersDetails: string[] = [];

  minorCategories.forEach((item) => {
    othersTotal += item.value;
    othersPercentage += parseFloat(item.percentage);
    othersDetails.push(`${item.name}: ${item.percentage}%`);
  });

  // 建立圖表資料
  const chartData = majorCategories.map((item) => ({
    name: item.name,
    value: item.value,
    percentage: item.percentage,
    isOthers: false,
    details: null,
  }));

  // 如果有小分類，加入「其他」項目
  if (minorCategories.length > 0) {
    chartData.push({
      name: "其他",
      value: othersTotal,
      percentage: othersPercentage.toFixed(1),
      isOthers: true,
      details: othersDetails,
    });
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel(mergeThreshold)}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          formatter={(value, entry: any) => {
            return `${value} (${entry.payload.percentage}%)`;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
