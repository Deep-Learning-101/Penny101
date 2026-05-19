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
import { Plus, Pencil, Trash2, Power, PowerOff } from "lucide-react";
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  toggleAccountStatus,
} from "@/app/actions/settings";

interface Account {
  id: number;
  name: string;
  type: "銀行" | "現金" | "電子支付";
  currency: string;
  isActive: boolean;
}

const ACCOUNT_TYPES = [
  { value: "銀行", label: "銀行" },
  { value: "現金", label: "現金" },
  { value: "電子支付", label: "電子支付" },
];

export function AccountManagement() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // 新增/編輯對話框狀態
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "銀行" as "銀行" | "現金" | "電子支付",
    currency: "TWD",
  });

  // 載入帳戶資料
  const loadAccounts = async () => {
    setLoading(true);
    const data = await getAccounts();
    setAccounts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  // 開啟新增對話框
  const openAddDialog = () => {
    setEditingAccount(null);
    setFormData({
      name: "",
      type: "銀行",
      currency: "TWD",
    });
    setDialogOpen(true);
  };

  // 開啟編輯對話框
  const openEditDialog = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      currency: account.currency,
    });
    setDialogOpen(true);
  };

  // 儲存帳戶
  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("請輸入帳戶名稱");
      return;
    }

    let result;
    if (editingAccount) {
      // 更新
      result = await updateAccount(editingAccount.id, formData);
    } else {
      // 新增
      result = await createAccount(formData);
    }

    if (result.success) {
      setDialogOpen(false);
      loadAccounts();
    } else {
      alert(result.error);
    }
  };

  // 切換啟用狀態
  const handleToggleStatus = async (account: Account) => {
    const action = account.isActive ? "停用" : "啟用";
    if (!confirm(`確定要${action}「${account.name}」嗎？`)) return;

    const result = await toggleAccountStatus(account.id);

    if (result.success) {
      loadAccounts();
    } else {
      alert(result.error);
    }
  };

  // 刪除帳戶
  const handleDelete = async (account: Account) => {
    if (!confirm(`確定要刪除「${account.name}」嗎？\n注意：若此帳戶有交易記錄則無法刪除。`)) {
      return;
    }

    const result = await deleteAccount(account.id);

    if (result.success) {
      loadAccounts();
    } else {
      alert(result.error);
    }
  };

  // 取得帳戶類型的顯示標籤
  const getTypeLabel = (type: string) => {
    return ACCOUNT_TYPES.find((t) => t.value === type)?.label || type;
  };

  // 取得帳戶類型的顏色
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "銀行":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "現金":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "電子支付":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">載入中...</div>;
  }

  // 分組顯示：啟用的帳戶 / 停用的帳戶
  const activeAccounts = accounts.filter((a) => a.isActive);
  const inactiveAccounts = accounts.filter((a) => !a.isActive);

  return (
    <div className="space-y-6">
      {/* 啟用的帳戶 */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">啟用中的帳戶</h3>
        {activeAccounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg">
            尚無啟用的帳戶，請新增
          </div>
        ) : (
          <div className="space-y-2">
            {activeAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between border rounded-lg p-4 hover:bg-muted/50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="font-semibold">{account.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${getTypeBadgeColor(
                          account.type
                        )}`}
                      >
                        {getTypeLabel(account.type)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {account.currency}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(account)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(account)}
                    title="停用帳戶"
                  >
                    <PowerOff className="h-4 w-4 text-orange-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(account)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 停用的帳戶 */}
      {inactiveAccounts.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg text-muted-foreground">已停用的帳戶</h3>
          <div className="space-y-2">
            {inactiveAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between border rounded-lg p-4 bg-muted/30 opacity-60"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="font-semibold line-through">{account.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${getTypeBadgeColor(
                          account.type
                        )}`}
                      >
                        {getTypeLabel(account.type)}
                      </span>
                      <span className="text-xs text-muted-foreground">已停用</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(account)}
                    title="啟用帳戶"
                  >
                    <Power className="h-4 w-4 text-green-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(account)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 新增帳戶按鈕 */}
      <Button onClick={openAddDialog} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        新增帳戶
      </Button>

      {/* 新增/編輯對話框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? "編輯帳戶" : "新增帳戶"}</DialogTitle>
            <DialogDescription>
              {editingAccount ? "修改帳戶資訊" : "建立新的帳戶"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">帳戶名稱</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：中信銀行、現金、LINE Pay"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">帳戶類型</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">幣別</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                placeholder="TWD"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>儲存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
