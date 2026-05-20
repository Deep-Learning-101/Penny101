"use server";

import { db } from "@/db";
import { transactions, accounts, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * 匯出所有交易記錄為 CSV 格式（使用名稱而非 ID）
 */
export async function exportTransactionsCSV() {
  try {
    // 查詢所有交易記錄（含帳戶與分類名稱）
    const allTransactions = await db
      .select({
        id: transactions.id,
        transactionDate: transactions.transactionDate,
        amount: transactions.amount,
        type: transactions.type,
        accountName: accounts.name,
        categoryName: categories.name,
        memo: transactions.memo,
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .orderBy(transactions.transactionDate);

    // 建立 CSV 標題
    const header = "id,transactionDate,amount,type,accountName,categoryName,memo\n";

    // 建立 CSV 內容
    const rows = allTransactions
      .map((row) => {
        const memo = row.memo ? `"${row.memo.replace(/"/g, '""')}"` : "";
        const accountName = row.accountName || "";
        const categoryName = row.categoryName || "";
        return `${row.id},${row.transactionDate},${row.amount},${row.type},"${accountName}","${categoryName}",${memo}`;
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
 * 匯入 CSV 交易記錄（自動創建缺失的帳戶和分類）
 * 支援外部記帳軟體格式："日期","類別","主分類","子分類","帳戶","專案","金額","匯率","小計","更新時間","地址","發票號碼","轉帳","備註"
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

    // 讀取標題行（用於檢測格式）
    const headerLine = lines[0];
    const isExternalFormat = headerLine.includes("主分類") || headerLine.includes("子分類");

    // 跳過標題行
    const dataLines = lines.slice(1);

    // 建立帳戶和分類的名稱到 ID 的對應表
    const accountMap = new Map<string, number>();
    const categoryMap = new Map<string, number>();

    // 載入現有帳戶和分類
    const existingAccounts = await db.select().from(accounts);
    const existingCategories = await db.select().from(categories);

    existingAccounts.forEach((acc) => accountMap.set(acc.name, acc.id));
    existingCategories.forEach((cat) => categoryMap.set(cat.name, cat.id));

    const recordsToImport = [];
    const errors: string[] = [];
    const createdAccounts: string[] = [];
    const createdCategories: string[] = [];

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

        let transactionDate: string;
        let amount: string;
        let type: string;
        let accountName: string;
        let categoryName: string;
        let memo: string;

        if (isExternalFormat) {
          // 外部格式：第0欄日期、第1欄類別、第2欄主分類、第4欄帳戶、第6欄金額、第13欄備註
          if (parts.length < 7) {
            errors.push(`第 ${i + 2} 行：欄位數量不足`);
            continue;
          }

          transactionDate = parts[0]?.replace(/^"|"$/g, "").trim() || "";
          type = parts[1]?.replace(/^"|"$/g, "").trim() || "";
          categoryName = parts[2]?.replace(/^"|"$/g, "").trim() || "";
          accountName = parts[4]?.replace(/^"|"$/g, "").trim() || "";
          amount = parts[6]?.replace(/^"|"$/g, "").trim() || "";
          memo = parts[13]?.replace(/^"|"$/g, "").trim() || "";

          // 處理金額格式（移除小數點後多餘的 0）
          if (amount) {
            const numAmount = parseFloat(amount);
            amount = numAmount.toString();
          }
        } else {
          // 內部格式：id, transactionDate, amount, type, accountName, categoryName, memo
          if (parts.length < 6) {
            errors.push(`第 ${i + 2} 行：欄位數量不足`);
            continue;
          }

          transactionDate = parts[1]?.replace(/^"|"$/g, "").trim() || "";
          amount = parts[2]?.replace(/^"|"$/g, "").trim() || "";
          type = parts[3]?.replace(/^"|"$/g, "").trim() || "";
          accountName = parts[4]?.replace(/^"|"$/g, "").trim() || "";
          categoryName = parts[5]?.replace(/^"|"$/g, "").trim() || "";
          memo = parts[6]?.replace(/^"|"$/g, "").trim() || "";
        }

        // 驗證資料
        if (!transactionDate || !amount || !type || !accountName || !categoryName) {
          errors.push(`第 ${i + 2} 行：必填欄位缺失`);
          continue;
        }

        if (type !== "收入" && type !== "支出") {
          errors.push(`第 ${i + 2} 行：類型必須是「收入」或「支出」`);
          continue;
        }

        const cleanAccountName = accountName;
        const cleanCategoryName = categoryName;
        const cleanMemo = memo;

        // 檢查並自動創建帳戶
        let accountId = accountMap.get(cleanAccountName);
        if (!accountId) {
          const [newAccount] = await db
            .insert(accounts)
            .values({
              name: cleanAccountName,
              type: "銀行", // 預設類型
              isActive: true,
            })
            .returning({ id: accounts.id });
          accountId = newAccount.id;
          accountMap.set(cleanAccountName, accountId);
          createdAccounts.push(cleanAccountName);
        }

        // 檢查並自動創建分類
        let categoryId = categoryMap.get(cleanCategoryName);
        if (!categoryId) {
          const [newCategory] = await db
            .insert(categories)
            .values({
              name: cleanCategoryName,
              type: type as "收入" | "支出",
              parentId: null,
            })
            .returning({ id: categories.id });
          categoryId = newCategory.id;
          categoryMap.set(cleanCategoryName, categoryId);
          createdCategories.push(cleanCategoryName);
        }

        recordsToImport.push({
          transactionDate,
          amount,
          type: type as "收入" | "支出",
          accountId,
          categoryId,
          memo: cleanMemo || null,
        });
      } catch (error) {
        errors.push(`第 ${i + 2} 行：解析錯誤 - ${error}`);
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

    let message = `成功匯入 ${recordsToImport.length} 筆交易記錄`;
    if (createdAccounts.length > 0) {
      message += `\n自動創建 ${createdAccounts.length} 個帳戶：${createdAccounts.slice(0, 3).join(", ")}${createdAccounts.length > 3 ? "..." : ""}`;
    }
    if (createdCategories.length > 0) {
      message += `\n自動創建 ${createdCategories.length} 個分類：${createdCategories.slice(0, 3).join(", ")}${createdCategories.length > 3 ? "..." : ""}`;
    }

    return {
      success: true,
      importedCount: recordsToImport.length,
      message,
    };
  } catch (error) {
    console.error("importTransactionsCSV error:", error);
    return {
      success: false,
      error: "匯入失敗，請確認檔案格式正確",
    };
  }
}

/**
 * 清空所有交易記錄（危險操作）
 */
export async function clearAllTransactions() {
  try {
    await db.delete(transactions);

    // 更新所有頁面快取
    revalidatePath("/");
    revalidatePath("/reports");
    revalidatePath("/accounts");

    return {
      success: true,
    };
  } catch (error) {
    console.error("clearAllTransactions error:", error);
    return {
      success: false,
      error: "清空資料失敗",
    };
  }
}
