"use server";

import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
