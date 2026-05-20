"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Pencil } from "lucide-react";
import { deleteTransaction, getTransaction, updateTransaction } from "@/app/actions/transactions";
import { getActiveAccounts } from "@/app/actions/accounts";
import { getCategories } from "@/app/actions/categories";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(timezone);

interface Transaction {
  id: number;
  transactionDate: string;
  displayDate: string;
  amount: string;
  type: "收入" | "支出";
  memo: string;
  accountName: string;
  categoryName: string;
}

interface Account {
  id: number;
  name: string;
  type: string;
}

interface Category {
  id: number;
  name: string;
  type: "收入" | "支出";
  parentId: number | null;
  children?: Category[];
}

export function RecentTransactionsList({ transactions }: { transactions: Transaction[] }) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    transactionDate: "",
    amount: "",
    type: "支出" as "收入" | "支出",
    accountId: 0,
    categoryId: 0,
    memo: "",
    includeInStats: true,
  });

  useEffect(() => {
    loadAccounts();
    loadCategories();
  }, []);

  const loadAccounts = async () => {
    const data = await getActiveAccounts();
    setAccounts(data);
  };

  const loadCategories = async () => {
    const data = await getCategories();
    setCategories(data);
  };

  const openEditDialog = async (transaction: Transaction) => {
    setEditingTransaction(transaction);

    // 取得完整交易資訊（包含 accountId, categoryId）
    const result = await getTransaction(transaction.id);
    if (result.success && result.data) {
      const tx = result.data;
      setFormData({
        transactionDate: dayjs(tx.transactionDate).tz("Asia/Taipei").format("YYYY-MM-DD"),
        amount: tx.amount,
        type: tx.type,
        accountId: tx.accountId,
        categoryId: tx.categoryId,
        memo: tx.memo || "",
        includeInStats: tx.includeInStats ?? true,
      });
      setEditDialogOpen(true);
    } else {
      alert("無法載入交易資料");
    }
  };

  const handleUpdate = async () => {
    if (!editingTransaction) return;

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert("請輸入有效的金額");
      return;
    }

    if (!formData.accountId || !formData.categoryId) {
      alert("請選擇帳戶和分類");
      return;
    }

    const result = await updateTransaction(editingTransaction.id, {
      transactionDate: dayjs(formData.transactionDate).tz("Asia/Taipei").toISOString(),
      amount: formData.amount,
      type: formData.type,
      accountId: formData.accountId,
      categoryId: formData.categoryId,
      memo: formData.memo,
      includeInStats: formData.includeInStats,
    });

    if (result.success) {
      setEditDialogOpen(false);
      setEditingTransaction(null);
    } else {
      alert(result.error || "更新失敗");
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const result = await deleteTransaction(id);
      if (!result.success) {
        alert(result.error || "刪除失敗");
      }
    } catch (error) {
      alert("刪除失敗，請稍後再試");
    } finally {
      setDeletingId(null);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        尚無交易記錄，點擊右下角按鈕新增第一筆記帳
      </div>
    );
  }

  // 篩選當前類型的分類
  const filteredCategories = categories.filter((cat) => cat.type === formData.type);

  return (
    <>
      <div className="space-y-2">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            {/* 左側：日期、分類、帳戶 */}
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {transaction.displayDate}
                </span>
                <Badge variant={transaction.type === "收入" ? "default" : "destructive"}>
                  {transaction.type}
                </Badge>
              </div>
              <div className="font-medium">{transaction.categoryName}</div>
              <div className="text-sm text-muted-foreground">
                {transaction.accountName}
                {transaction.memo && ` · ${transaction.memo}`}
              </div>
            </div>

            {/* 中間：金額 */}
            <div
              className={`text-xl font-bold mr-4 ${
                transaction.type === "收入" ? "text-green-600" : "text-red-600"
              }`}
            >
              {transaction.type === "收入" ? "+" : "-"}NT$ {Number(transaction.amount).toLocaleString()}
            </div>

            {/* 右側：編輯與刪除按鈕 */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEditDialog(transaction)}
                className="text-muted-foreground hover:text-primary"
              >
                <Pencil className="h-4 w-4" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={deletingId === transaction.id}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>確認刪除</AlertDialogTitle>
                    <AlertDialogDescription>
                      確定要刪除這筆交易記錄嗎？此操作無法復原。
                      <div className="mt-2 p-2 bg-muted rounded text-sm">
                        <div>類別：{transaction.categoryName}</div>
                        <div>金額：NT$ {Number(transaction.amount).toLocaleString()}</div>
                        <div>日期：{transaction.displayDate}</div>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(transaction.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      確認刪除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>

      {/* 編輯交易對話框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>編輯交易記錄</DialogTitle>
            <DialogDescription>
              修改交易資訊
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-date">日期</Label>
              <Input
                id="edit-date"
                type="date"
                value={formData.transactionDate}
                onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-type">類型</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as "收入" | "支出" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="支出">支出</SelectItem>
                  <SelectItem value="收入">收入</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-amount">金額</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-account">帳戶</Label>
              <Select
                value={formData.accountId.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, accountId: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇帳戶" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">分類</Label>
              <Select
                value={formData.categoryId.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryId: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇分類" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((category) => (
                    <optgroup key={category.id} label={category.name}>
                      <SelectItem value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                      {category.children?.map((child) => (
                        <SelectItem key={child.id} value={child.id.toString()}>
                          　├─ {child.name}
                        </SelectItem>
                      ))}
                    </optgroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-memo">備註</Label>
              <Input
                id="edit-memo"
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                placeholder="選填"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="edit-includeInStats"
                type="checkbox"
                checked={formData.includeInStats}
                onChange={(e) => setFormData({ ...formData, includeInStats: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="edit-includeInStats" className="cursor-pointer">
                計入統計
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdate}>
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
