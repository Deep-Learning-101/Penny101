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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, ChevronRight } from "lucide-react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/actions/settings";

interface Category {
  id: number;
  name: string;
  type: "支出" | "收入";
  parentId: number | null;
  children?: Category[];
}

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"支出" | "收入">("支出");

  // 新增/編輯對話框狀態
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "支出" as "支出" | "收入",
    parentId: null as number | null,
  });

  // 載入分類資料
  const loadCategories = async () => {
    setLoading(true);
    const data = await getCategories();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // 篩選當前標籤的分類
  const filteredCategories = categories.filter((c) => c.type === activeTab);

  // 開啟新增對話框
  const openAddDialog = (type: "支出" | "收入", parentId: number | null = null) => {
    setEditingCategory(null);
    setFormData({
      name: "",
      type,
      parentId,
    });
    setDialogOpen(true);
  };

  // 開啟編輯對話框
  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      parentId: category.parentId,
    });
    setDialogOpen(true);
  };

  // 儲存分類
  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("請輸入分類名稱");
      return;
    }

    let result;
    if (editingCategory) {
      // 更新
      result = await updateCategory(editingCategory.id, {
        name: formData.name,
      });
    } else {
      // 新增
      result = await createCategory(formData);
    }

    if (result.success) {
      setDialogOpen(false);
      loadCategories();
    } else {
      alert(result.error);
    }
  };

  // 刪除分類
  const handleDelete = async (category: Category) => {
    const confirmMsg = category.parentId
      ? `確定要刪除子分類「${category.name}」嗎？`
      : `確定要刪除主分類「${category.name}」嗎？`;

    if (!confirm(confirmMsg)) return;

    const result = await deleteCategory(category.id);

    if (result.success) {
      loadCategories();
    } else {
      alert(result.error);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">載入中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 類型切換 */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "支出" ? "default" : "outline"}
          onClick={() => setActiveTab("支出")}
        >
          支出分類
        </Button>
        <Button
          variant={activeTab === "收入" ? "default" : "outline"}
          onClick={() => setActiveTab("收入")}
        >
          收入分類
        </Button>
      </div>

      {/* 分類列表 */}
      <div className="space-y-4">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            尚無{activeTab}分類，請新增
          </div>
        ) : (
          filteredCategories.map((mainCategory) => (
            <div key={mainCategory.id} className="border rounded-lg p-4 space-y-2">
              {/* 主分類 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{mainCategory.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({mainCategory.children?.length || 0} 個子分類)
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAddDialog(activeTab, mainCategory.id)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    新增子分類
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(mainCategory)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(mainCategory)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {/* 子分類 */}
              {mainCategory.children && mainCategory.children.length > 0 && (
                <div className="ml-6 space-y-1 border-l-2 border-muted pl-4">
                  {mainCategory.children.map((subCategory) => (
                    <div
                      key={subCategory.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <span>{subCategory.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(subCategory)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(subCategory)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 新增主分類按鈕 */}
      <Button onClick={() => openAddDialog(activeTab)} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        新增{activeTab}主分類
      </Button>

      {/* 新增/編輯對話框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "編輯分類" : "新增分類"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "修改分類名稱"
                : formData.parentId
                ? "新增子分類"
                : "新增主分類"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">分類名稱</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="請輸入分類名稱"
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
