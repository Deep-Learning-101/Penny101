"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import { getActiveAccounts } from "@/app/actions/accounts";
import { getCategoriesByType, type CategoryWithChildren } from "@/app/actions/categories";
import { addTransaction } from "@/app/actions/finance";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useRouter } from "next/navigation";

dayjs.extend(utc);
dayjs.extend(timezone);

interface Account {
  id: number;
  name: string;
  type: string;
}

export function AddTransactionFAB() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // 表單資料
  const [formData, setFormData] = useState({
    type: "支出" as "支出" | "收入",
    date: "",
    time: "",
    mainCategoryId: "",
    subCategoryId: "",
    accountId: "",
    amount: "",
    memo: "",
  });

  // 下拉選單資料
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [subCategories, setSubCategories] = useState<CategoryWithChildren[]>([]);

  // 載入帳戶資料
  useEffect(() => {
    const loadAccounts = async () => {
      const data = await getActiveAccounts();
      setAccounts(data);
    };
    loadAccounts();
  }, []);

  // 載入分類資料（根據類型）
  useEffect(() => {
    const loadCategories = async () => {
      const data = await getCategoriesByType(formData.type);
      setCategories(data);
      // 清空選擇
      setFormData((prev) => ({ ...prev, mainCategoryId: "", subCategoryId: "" }));
      setSubCategories([]);
    };
    loadCategories();
  }, [formData.type]);

  // 主分類變更時，載入子分類
  useEffect(() => {
    if (formData.mainCategoryId) {
      const mainCategory = categories.find((c) => c.id.toString() === formData.mainCategoryId);
      if (mainCategory && mainCategory.children) {
        setSubCategories(mainCategory.children);
      } else {
        setSubCategories([]);
      }
      // 清空子分類選擇
      setFormData((prev) => ({ ...prev, subCategoryId: "" }));
    } else {
      setSubCategories([]);
    }
  }, [formData.mainCategoryId, categories]);

  // 開啟對話框時，設定預設日期時間（Asia/Taipei）
  const handleOpen = () => {
    const now = dayjs().tz("Asia/Taipei");
    setFormData((prev) => ({
      ...prev,
      date: now.format("YYYY-MM-DD"),
      time: now.format("HH:mm"),
    }));
    setOpen(true);
  };

  // 提交表單
  const handleSubmit = async () => {
    // 驗證必填欄位
    if (!formData.date || !formData.time) {
      alert("請選擇日期與時間");
      return;
    }

    if (!formData.mainCategoryId) {
      alert("請選擇分類");
      return;
    }

    if (!formData.accountId) {
      alert("請選擇帳戶");
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      alert("請輸入正確的金額");
      return;
    }

    setLoading(true);

    // 組合日期時間（Asia/Taipei）
    const transactionDateTime = dayjs
      .tz(`${formData.date} ${formData.time}`, "Asia/Taipei")
      .toISOString();

    // 決定使用主分類或子分類
    const categoryId = formData.subCategoryId
      ? Number(formData.subCategoryId)
      : Number(formData.mainCategoryId);

    const result = await addTransaction({
      transactionDate: transactionDateTime,
      amount: formData.amount,
      type: formData.type,
      accountId: Number(formData.accountId),
      categoryId,
      memo: formData.memo,
    });

    setLoading(false);

    if (result.success) {
      setOpen(false);
      // 重置表單
      setFormData({
        type: "支出",
        date: "",
        time: "",
        mainCategoryId: "",
        subCategoryId: "",
        accountId: "",
        amount: "",
        memo: "",
      });
      // 重新載入頁面以更新資料
      router.refresh();
    } else {
      alert(`新增失敗：${result.error}`);
    }
  };

  return (
    <>
      {/* 懸浮按鈕 (FAB) */}
      <button
        onClick={handleOpen}
        className="fixed bottom-8 right-8 w-16 h-16 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-50"
        aria-label="新增記帳"
      >
        <PlusCircle className="h-8 w-8" />
      </button>

      {/* 新增記帳對話框 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增記帳</DialogTitle>
            <DialogDescription>記錄一筆收入或支出</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 類型切換 */}
            <div className="space-y-2">
              <Label>類型</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.type === "支出" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, type: "支出" })}
                  className="flex-1"
                >
                  支出
                </Button>
                <Button
                  type="button"
                  variant={formData.type === "收入" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, type: "收入" })}
                  className="flex-1"
                >
                  收入
                </Button>
              </div>
            </div>

            {/* 日期 */}
            <div className="space-y-2">
              <Label htmlFor="date">日期</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            {/* 時間 */}
            <div className="space-y-2">
              <Label htmlFor="time">時間</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>

            {/* 主分類 */}
            <div className="space-y-2">
              <Label htmlFor="mainCategory">主分類</Label>
              <Select
                value={formData.mainCategoryId}
                onValueChange={(value) =>
                  setFormData({ ...formData, mainCategoryId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="請選擇主分類" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 子分類（主分類有子分類時才顯示） */}
            {subCategories.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="subCategory">子分類（可選）</Label>
                <Select
                  value={formData.subCategoryId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, subCategoryId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="請選擇子分類" />
                  </SelectTrigger>
                  <SelectContent>
                    {subCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 帳戶 */}
            <div className="space-y-2">
              <Label htmlFor="account">帳戶</Label>
              <Select
                value={formData.accountId}
                onValueChange={(value) => setFormData({ ...formData, accountId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="請選擇帳戶" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name} ({account.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 金額 */}
            <div className="space-y-2">
              <Label htmlFor="amount">金額</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            {/* 備註 */}
            <div className="space-y-2">
              <Label htmlFor="memo">備註（可選）</Label>
              <Input
                id="memo"
                type="text"
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                placeholder="例如：午餐、捷運..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "儲存中..." : "儲存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
