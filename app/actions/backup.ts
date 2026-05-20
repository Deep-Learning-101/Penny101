"use server";

import { db } from "@/db";
import { transactions, accounts, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import Papa from "papaparse";

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
 * 使用 PapaParse 解析 CSV，正確處理備註欄位中的換行符號
 */
export async function importTransactionsCSV(csvContent: string) {
  try {
    // 使用 PapaParse 解析 CSV
    const parseResult = Papa.parse(csvContent, {
      header: false,
      skipEmptyLines: true,
    });

    if (parseResult.errors.length > 0) {
      console.error("CSV 解析錯誤:", parseResult.errors);
      return {
        success: false,
        error: `CSV 解析錯誤：${parseResult.errors[0].message}`,
      };
    }

    const rows = parseResult.data as string[][];

    if (rows.length < 2) {
      return {
        success: false,
        error: "CSV 檔案格式錯誤或沒有資料",
      };
    }

    // 讀取標題行（用於檢測格式）
    const headerRow = rows[0];
    const isExternalFormat = headerRow.some((col) => col.includes("主分類") || col.includes("子分類"));

    // 跳過標題行
    const dataRows = rows.slice(1);

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

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];

      // 確保該行有足夠的欄位
      if (!row || row.length < 14) {
        errors.push(`第 ${i + 2} 行：欄位數量不足（需要至少 14 個欄位）`);
        continue;
      }

      try {
        // 嚴格按照外部 CSV 格式解析（index 0=日期, 1=類型, 2=主分類, 4=帳戶, 6=金額, 13=備註）
        const transactionDate = row[0]?.trim() || "";
        const type = row[1]?.trim() || "";
        const rawCategory = row[2]?.trim() || "";
        const cleanAccountName = row[4]?.trim() || "";
        const amount = row[6]?.trim() || "";
        const cleanMemo = row[13]?.trim() || "";
        // 極度重要：遇到轉帳或無分類時，強制設為"未分類"
        const cleanCategoryName = rawCategory || "未分類";

        // 驗證資料
        if (!transactionDate || !amount || !type || !cleanAccountName) {
          errors.push(`第 ${i + 2} 行：必填欄位缺失`);
          continue;
        }

        if (type !== "收入" && type !== "支出") {
          errors.push(`第 ${i + 2} 行：類型必須是「收入」或「支出」`);
          continue;
        }

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
