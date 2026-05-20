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
    // 使用 PapaParse 解析 CSV，加入容錯參數
    const parseResult = Papa.parse(csvContent, {
      header: false,
      skipEmptyLines: true,
      quoteChar: '"',
      escapeChar: '"',
      // 關鍵：不要因為個別行錯誤就中斷解析
      error: (error) => {
        console.warn("PapaParse 警告:", error);
      },
    });

    const rows = parseResult.data as string[][];
    const parseErrors = parseResult.errors || [];

    // 記錄解析錯誤但不中斷
    if (parseErrors.length > 0) {
      console.warn(`CSV 解析時發現 ${parseErrors.length} 個錯誤，將略過錯誤行並繼續處理正確資料`);
    }

    if (rows.length < 1) {
      return {
        success: false,
        error: "CSV 檔案格式錯誤或沒有資料",
      };
    }

    // 讀取標題行（用於檢測格式）
    const headerRow = rows[0];
    const isExternalFormat = headerRow.some((col) => col.includes("主分類") || col.includes("子分類"));

    // 嚴格跳過標題行：檢查第一欄是否為「日期」或「id」等標題特徵
    const isFirstRowHeader =
      headerRow[0] === "日期" ||
      headerRow[0] === "id" ||
      headerRow[0] === "transactionDate" ||
      headerRow.some((col) => col.includes("主分類") || col.includes("子分類"));

    const dataRows = isFirstRowHeader ? rows.slice(1) : rows;

    // 建立帳戶和分類的名稱到 ID 的對應表
    const accountMap = new Map<string, number>();
    const categoryMap = new Map<string, number>();

    // 載入現有帳戶和分類
    const existingAccounts = await db.select().from(accounts);
    const existingCategories = await db.select().from(categories);

    existingAccounts.forEach((acc) => accountMap.set(acc.name, acc.id));
    existingCategories.forEach((cat) => categoryMap.set(cat.name, cat.id));

    const recordsToImport = [];
    const skippedRows: string[] = [];
    const createdAccounts: string[] = [];
    const createdCategories: string[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];

      // 再次檢查是否為標題列（防止標題混入資料）
      if (row[0] === "日期" || row[0] === "id" || row[0] === "transactionDate") {
        continue;
      }

      // 確保該行有足夠的欄位 - 改為略過而非累積錯誤
      if (!row || row.length < 14) {
        skippedRows.push(`第 ${i + 2} 行：欄位數量不足`);
        continue;
      }

      try {
        // 嚴格按照外部 CSV 格式解析（index 0=日期, 1=類型, 2=主分類, 4=帳戶, 6=金額, 13=備註）
        const rawDate = row[0]?.trim() || "";
        const type = row[1]?.trim() || "";
        const rawCategory = row[2]?.trim() || "";
        const cleanAccountName = row[4]?.trim() || "";
        const rawAmount = row[6]?.trim() || "";
        const cleanMemo = row[13]?.trim() || "";
        // 極度重要：遇到轉帳或無分類時，強制設為"未分類"
        const cleanCategoryName = rawCategory || "未分類";

        // 驗證資料 - 改為略過而非累積錯誤
        if (!rawDate || !rawAmount || !type || !cleanAccountName) {
          skippedRows.push(`第 ${i + 2} 行：必填欄位缺失`);
          continue;
        }

        if (type !== "收入" && type !== "支出") {
          skippedRows.push(`第 ${i + 2} 行：類型必須是「收入」或「支出」`);
          continue;
        }

        // 嚴格轉換日期為 ISO 格式
        const transactionDate = dayjs(rawDate).tz("Asia/Taipei").toISOString();
        if (!dayjs(rawDate).isValid()) {
          skippedRows.push(`第 ${i + 2} 行：日期格式無效`);
          continue;
        }

        // 嚴格轉換金額為數字字串，防止 NaN
        const amountNum = parseFloat(rawAmount);
        if (isNaN(amountNum)) {
          skippedRows.push(`第 ${i + 2} 行：金額格式無效`);
          continue;
        }
        const amount = amountNum.toString();

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
        skippedRows.push(`第 ${i + 2} 行：解析錯誤 - ${error}`);
      }
    }

    // 改為 graceful degradation：只要有成功的資料就繼續匯入
    if (recordsToImport.length === 0) {
      return {
        success: false,
        error: `匯入失敗，所有資料行都無法解析。略過的行數：${skippedRows.length}`,
      };
    }

    // 批次插入
    if (recordsToImport.length > 0) {
      await db.insert(transactions).values(recordsToImport);
    }

    // 更新首頁快取
    revalidatePath("/");
    revalidatePath("/reports");

    // 建立詳細的回報訊息
    let message = `成功匯入 ${recordsToImport.length} 筆交易記錄`;

    if (skippedRows.length > 0) {
      message += `。有 ${skippedRows.length} 筆因為格式異常被略過`;
    }

    if (createdAccounts.length > 0) {
      message += `\n自動創建 ${createdAccounts.length} 個帳戶：${createdAccounts.slice(0, 3).join(", ")}${createdAccounts.length > 3 ? "..." : ""}`;
    }
    if (createdCategories.length > 0) {
      message += `\n自動創建 ${createdCategories.length} 個分類：${createdCategories.slice(0, 3).join(", ")}${createdCategories.length > 3 ? "..." : ""}`;
    }

    return {
      success: true,
      importedCount: recordsToImport.length,
      skippedCount: skippedRows.length,
      message,
    };
  } catch (error) {
    console.error("importTransactionsCSV error:", error);
    return {
      success: false,
      error: "系統例外錯誤：" + (error instanceof Error ? error.message : String(error)),
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
