"use server";

import { db } from "@/db";
import { transactions, accounts, categories } from "@/db/schema";
import { revalidatePath } from "next/cache";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * 匯出所有交易記錄為 CSV 格式
 */
export async function exportTransactionsCSV() {
  try {
    // 查詢所有交易記錄
    const allTransactions = await db
      .select({
        id: transactions.id,
        transactionDate: transactions.transactionDate,
        amount: transactions.amount,
        type: transactions.type,
        accountId: transactions.accountId,
        categoryId: transactions.categoryId,
        memo: transactions.memo,
      })
      .from(transactions)
      .orderBy(transactions.transactionDate);

    // 建立 CSV 標題
    const header = "id,transactionDate,amount,type,accountId,categoryId,memo\n";

    // 建立 CSV 內容
    const rows = allTransactions
      .map((row) => {
        const memo = row.memo ? `"${row.memo.replace(/"/g, '""')}"` : "";
        return `${row.id},${row.transactionDate},${row.amount},${row.type},${row.accountId},${row.categoryId},${memo}`;
      })
      .join("\n");

    const csv = header + rows;

    return {
      success: true,
      data: csv,
      filename: `Penny101_export_${dayjs().format("YYYYMMDD_HHmmss")}.csv`,
    };
  } catch (error) {
    console.error("exportTransactionsCSV error:", error);
    return {
      success: false,
      error: "匯出失敗",
    };
  }
}

/**
 * 匯入 CSV 交易記錄
 */
export async function importTransactionsCSV(csvContent: string) {
  try {
    // 解析 CSV
    const lines = csvContent.trim().split("\n");
    if (lines.length < 2) {
      return {
        success: false,
        error: "CSV 檔案格式錯誤或沒有資料",
      };
    }

    // 跳過標題行
    const dataLines = lines.slice(1);

    // 驗證帳戶和分類是否存在
    const allAccounts = await db.select({ id: accounts.id }).from(accounts);
    const allCategories = await db.select({ id: categories.id }).from(categories);
    const accountIds = new Set(allAccounts.map((a) => a.id));
    const categoryIds = new Set(allCategories.map((c) => c.id));

    const recordsToImport = [];
    const errors: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;

      try {
        // 解析 CSV 行（處理帶引號的欄位）
        const parts: string[] = [];
        let current = "";
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            parts.push(current);
            current = "";
          } else {
            current += char;
          }
        }
        parts.push(current);

        if (parts.length < 6) {
          errors.push(`第 ${i + 2} 行：欄位數量不足`);
          continue;
        }

        const [_id, transactionDate, amount, type, accountId, categoryId, memo] = parts;

        // 驗證資料
        if (!transactionDate || !amount || !type || !accountId || !categoryId) {
          errors.push(`第 ${i + 2} 行：必填欄位缺失`);
          continue;
        }

        if (type !== "收入" && type !== "支出") {
          errors.push(`第 ${i + 2} 行：類型必須是「收入」或「支出」`);
          continue;
        }

        const accountIdNum = parseInt(accountId);
        const categoryIdNum = parseInt(categoryId);

        if (!accountIds.has(accountIdNum)) {
          errors.push(`第 ${i + 2} 行：帳戶 ID ${accountId} 不存在`);
          continue;
        }

        if (!categoryIds.has(categoryIdNum)) {
          errors.push(`第 ${i + 2} 行：分類 ID ${categoryId} 不存在`);
          continue;
        }

        recordsToImport.push({
          transactionDate,
          amount,
          type: type as "收入" | "支出",
          accountId: accountIdNum,
          categoryId: categoryIdNum,
          memo: memo || null,
        });
      } catch (error) {
        errors.push(`第 ${i + 2} 行：解析錯誤`);
      }
    }

    // 如果有錯誤，返回錯誤訊息
    if (errors.length > 0) {
      return {
        success: false,
        error: `匯入失敗，發現 ${errors.length} 個錯誤：\n${errors.slice(0, 5).join("\n")}${errors.length > 5 ? "\n..." : ""}`,
      };
    }

    // 批次插入
    if (recordsToImport.length > 0) {
      await db.insert(transactions).values(recordsToImport);
    }

    // 更新首頁快取
    revalidatePath("/");
    revalidatePath("/reports");

    return {
      success: true,
      importedCount: recordsToImport.length,
    };
  } catch (error) {
    console.error("importTransactionsCSV error:", error);
    return {
      success: false,
      error: "匯入失敗，請確認檔案格式正確",
    };
  }
}
