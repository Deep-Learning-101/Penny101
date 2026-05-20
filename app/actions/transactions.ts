"use server";

import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Decimal from "decimal.js";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(timezone);

/**
 * 取得單一交易記錄
 */
export async function getTransaction(id: number) {
  try {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);

    if (!transaction) {
      return {
        success: false,
        error: "交易記錄不存在",
      };
    }

    return {
      success: true,
      data: transaction,
    };
  } catch (error) {
    console.error("getTransaction error:", error);
    return {
      success: false,
      error: "查詢交易記錄失敗",
    };
  }
}

/**
 * 更新交易記錄
 */
export async function updateTransaction(
  id: number,
  data: {
    transactionDate?: string;
    amount?: string;
    type?: "收入" | "支出";
    accountId?: number;
    categoryId?: number;
    memo?: string;
    includeInStats?: boolean;
  }
) {
  try {
    // 驗證金額（如果有提供）
    if (data.amount) {
      const amountDecimal = new Decimal(data.amount);
      if (amountDecimal.lte(0)) {
        return {
          success: false,
          error: "金額必須大於 0",
        };
      }
      data.amount = amountDecimal.toFixed(2);
    }

    // 驗證日期（如果有提供）
    if (data.transactionDate) {
      const date = dayjs(data.transactionDate).tz("Asia/Taipei");
      if (!date.isValid()) {
        return {
          success: false,
          error: "日期格式錯誤",
        };
      }
      data.transactionDate = date.toISOString();
    }

    const [result] = await db
      .update(transactions)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(transactions.id, id))
      .returning();

    // 更新快取
    revalidatePath("/");
    revalidatePath("/accounts");
    revalidatePath("/reports");

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("updateTransaction error:", error);
    return {
      success: false,
      error: "更新交易記錄失敗",
    };
  }
}

/**
 * 刪除交易記錄
 */
export async function deleteTransaction(id: number) {
  try {
    await db.delete(transactions).where(eq(transactions.id, id));

    // 更新首頁快取
    revalidatePath("/");

    return {
      success: true,
    };
  } catch (error) {
    console.error("deleteTransaction error:", error);
    return {
      success: false,
      error: "刪除交易記錄失敗",
    };
  }
}
