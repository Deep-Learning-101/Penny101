/**
 * Server Actions 測試腳本
 * 執行方式：npx tsx scripts/test-actions.ts
 */

import { getDashboardStats, getMonthlyCategoryPie, getDailyTrend, getRecentTransactions } from "../app/actions/finance";
import { getAccounts } from "../app/actions/accounts";
import { getCategories } from "../app/actions/categories";

async function testServerActions() {
  console.log("🧪 測試 Server Actions...\n");

  try {
    // 測試取得帳戶
    console.log("📊 測試 getAccounts()");
    const accounts = await getAccounts();
    console.log(`✅ 取得 ${accounts.length} 個帳戶`);
    console.log(accounts);
    console.log("");

    // 測試取得分類
    console.log("📊 測試 getCategories()");
    const categories = await getCategories();
    console.log(`✅ 取得 ${categories.length} 個主分類`);
    console.log(categories);
    console.log("");

    // 測試當月統計
    const year = 2026;
    const month = 5;
    console.log(`📊 測試 getDashboardStats(${year}, ${month})`);
    const stats = await getDashboardStats(year, month);
    console.log("✅ 當月統計：");
    console.log(`   總收入: NT$ ${stats.totalIncome}`);
    console.log(`   總支出: NT$ ${stats.totalExpense}`);
    console.log(`   淨資產: NT$ ${stats.netWorth}`);
    console.log("");

    // 測試分類圓餅圖
    console.log(`📊 測試 getMonthlyCategoryPie(${year}, ${month})`);
    const pie = await getMonthlyCategoryPie(year, month);
    console.log(`✅ 取得 ${pie.length} 個分類統計：`);
    pie.forEach((item) => {
      console.log(`   ${item.categoryName}: NT$ ${item.amount} (${item.percentage}%)`);
    });
    console.log("");

    // 測試每日趨勢
    console.log(`📊 測試 getDailyTrend(${year}, ${month})`);
    const trend = await getDailyTrend(year, month);
    console.log(`✅ 取得 ${trend.length} 天的趨勢資料`);
    // 只顯示前 5 天
    trend.slice(0, 5).forEach((item) => {
      console.log(`   ${item.date}: NT$ ${item.amount}`);
    });
    console.log("   ...");
    console.log("");

    // 測試最近交易
    console.log("📊 測試 getRecentTransactions(10)");
    const recent = await getRecentTransactions(10);
    console.log(`✅ 取得 ${recent.length} 筆最近交易：`);
    recent.forEach((t) => {
      const sign = t.type === "支出" ? "-" : "+";
      console.log(`   ${t.displayDate} | ${t.type} ${sign}NT$ ${t.amount} | ${t.categoryName} | ${t.memo}`);
    });
    console.log("");

    console.log("✅ 所有測試完成！");
  } catch (error) {
    console.error("❌ 測試失敗：", error);
    process.exit(1);
  }
}

testServerActions();
