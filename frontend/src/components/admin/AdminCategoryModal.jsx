import { useState, useEffect, useMemo } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Check,
  GripVertical,
  Search,
  ChevronDown,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { getAuthToken } from "../../utils/auth";
import { showAdminToast } from "./AdminToast";
import { removeVietnameseTones, calculateSearchScore } from "../../utils/string";
import { ICON_MAP, CATEGORY_ICON_LIST } from "../../data/menuCategories";
import { API_BASE_URL } from "../../config/api";

function AdminCategoryModal({ isOpen, onClose }) {
  const [categories, setCategories] = useState([]);
  const [flatCategories, setFlatCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", parent_id: "", icon: "ChefHat" });
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [deleteConfirmCategory, setDeleteConfirmCategory] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const isChildDrag = flatCategories.find((c) => c.id === active.id)?.parent_id;

      if (isChildDrag) {
        const parentId = flatCategories.find((c) => c.id === active.id).parent_id;
        const parent = categories.find((c) => c.id === parentId);
        const oldIndex = parent.children.findIndex((c) => c.id === active.id);
        const newIndex = parent.children.findIndex((c) => c.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newChildren = arrayMove(parent.children, oldIndex, newIndex);
          const newCategories = categories.map((c) =>
            c.id === parentId ? { ...c, children: newChildren } : c
          );
          setCategories(newCategories);

          const order = newChildren.map((c, i) => ({ id: c.id, display_order: i }));
          fetch(`${API_BASE_URL}/categories/reorder`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
            body: JSON.stringify({ order }),
          }).then(() =>
            window.dispatchEvent(
              new CustomEvent("categoriesUpdated", { detail: { action: "reordered" } })
            )
          );
        }
      } else {
        const oldIndex = categories.findIndex((c) => c.id === active.id);
        const newIndex = categories.findIndex((c) => c.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newCategories = arrayMove(categories, oldIndex, newIndex);
          setCategories(newCategories);

          const order = newCategories.map((c, i) => ({ id: c.id, display_order: i }));
          fetch(`${API_BASE_URL}/categories/reorder`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
            body: JSON.stringify({ order }),
          }).then(() =>
            window.dispatchEvent(
              new CustomEvent("categoriesUpdated", { detail: { action: "reordered" } })
            )
          );
        }
      }
    }
  };

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      const result = await res.json();
      if (result.success) {
        setCategories(result.data);
        setFlatCategories(result.flatData);
      }
    } catch (error) {
      console.error("Lỗi lấy danh mục:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchCategories();
  }, [isOpen]);

  const handleSave = async () => {
    if (!editForm.name.trim()) {
      showAdminToast({ title: "Lỗi", message: "Vui lòng nhập tên danh mục", type: "error" });
      return;
    }

    try {
      const token = getAuthToken();
      const method = editingId === "new" ? "POST" : "PUT";
      const url =
        editingId === "new"
          ? `${API_BASE_URL}/categories`
          : `${API_BASE_URL}/categories/${editingId}`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name,
          parent_id: editForm.parent_id || null,
          icon: editForm.icon || "ChefHat",
        }),
      });

      const result = await res.json();
      if (result.success) {
        showAdminToast({ title: "Thành công", message: result.message });
        setEditingId(null);
        await fetchCategories();

        window.dispatchEvent(
          new CustomEvent("categoriesUpdated", {
            detail: {
              newCategory: result.data,
              action: editingId === "new" ? "created" : "updated",
            },
          })
        );
      } else {
        showAdminToast({ title: "Lỗi", message: result.message, type: "error" });
      }
    } catch (error) {
      console.error("Lỗi lưu danh mục:", error);
      showAdminToast({ title: "Lỗi", message: "Lỗi kết nối", type: "error" });
    }
  };

  const handleDelete = (category) => {
    setDeleteConfirmCategory(category);
  };

  const executeDeleteCategory = async (id) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();
      if (result.success) {
        showAdminToast({ title: "Thành công", message: result.message });
        await fetchCategories();
        window.dispatchEvent(
          new CustomEvent("categoriesUpdated", { detail: { action: "deleted", id } })
        );
      } else {
        showAdminToast({ title: "Lỗi", message: result.message, type: "error" });
      }
    } catch (error) {
      showAdminToast({ title: "Lỗi", message: "Lỗi kết nối", type: "error" });
    } finally {
      setDeleteConfirmCategory(null);
    }
  };

  if (!isOpen) return null;

  const parentOptions = flatCategories.filter((c) => !c.parent_id);

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Quản lý danh mục thực đơn</h2>
              <p className="text-xs text-slate-500">Tùy chỉnh tên, icon minh họa và sắp xếp thứ tự</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {isLoading ? (
            <div className="text-center py-10 text-gray-500 font-medium">Đang tải danh mục...</div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => {
                  setEditingId("new");
                  setEditForm({ name: "", parent_id: "", icon: "ChefHat" });
                }}
                className="w-full py-3.5 mb-4 border-2 border-dashed border-emerald-500/80 bg-emerald-50/40 text-emerald-700 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-50 hover:border-emerald-600 transition shadow-sm"
              >
                <Plus size={18} />
                Thêm danh mục mới
              </button>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div className="bg-gray-50/70 rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
                  <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                    {categories.map((category) => (
                      <div key={category.id} className="border-b border-gray-100 last:border-0">
                        <CategoryRow
                          category={category}
                          editingId={editingId}
                          editForm={editForm}
                          setEditForm={setEditForm}
                          setEditingId={setEditingId}
                          handleSave={handleSave}
                          handleDelete={handleDelete}
                          parentOptions={parentOptions}
                          onOpenIconPicker={() => setIsIconPickerOpen(true)}
                        />

                        <SortableContext
                          items={(category.children || []).map((c) => c.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {category.children?.map((child) => (
                            <CategoryRow
                              key={child.id}
                              category={child}
                              isChild
                              editingId={editingId}
                              editForm={editForm}
                              setEditForm={setEditForm}
                              setEditingId={setEditingId}
                              handleSave={handleSave}
                              handleDelete={handleDelete}
                              parentOptions={parentOptions}
                              onOpenIconPicker={() => setIsIconPickerOpen(true)}
                            />
                          ))}
                        </SortableContext>
                      </div>
                    ))}
                  </SortableContext>

                  {editingId === "new" && (
                    <CategoryEditRow
                      editForm={editForm}
                      setEditForm={setEditForm}
                      onSave={handleSave}
                      onCancel={() => setEditingId(null)}
                      parentOptions={parentOptions}
                      onOpenIconPicker={() => setIsIconPickerOpen(true)}
                    />
                  )}
                </div>
              </DndContext>
            </div>
          )}
        </div>
      </div>

      {/* ICON PICKER MODAL */}
      {isIconPickerOpen && (
        <IconPickerModal
          selectedIcon={editForm.icon}
          onSelect={(iconValue) => {
            setEditForm((prev) => ({ ...prev, icon: iconValue }));
            setIsIconPickerOpen(false);
          }}
          onClose={() => setIsIconPickerOpen(false)}
        />
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirmCategory && (
        <div className="fixed inset-0 z-[10002] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 size={22} />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-800">Xác nhận xóa danh mục</h4>
              <p className="text-xs text-slate-500 mt-1">
                Bạn có chắc chắn muốn xóa danh mục <span className="font-bold text-slate-800">"{deleteConfirmCategory.name}"</span>? Thao tác này không thể hoàn tác.
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirmCategory(null)}
                className="h-9 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => executeDeleteCategory(deleteConfirmCategory.id)}
                className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryRow({
  category,
  isChild,
  editingId,
  editForm,
  setEditForm,
  setEditingId,
  handleSave,
  handleDelete,
  parentOptions,
  onOpenIconPicker,
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: category.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (editingId === category.id) {
    return (
      <CategoryEditRow
        isChild={isChild}
        editForm={editForm}
        setEditForm={setEditForm}
        onSave={handleSave}
        onCancel={() => setEditingId(null)}
        parentOptions={parentOptions}
        onOpenIconPicker={onOpenIconPicker}
      />
    );
  }

  const IconComp = ICON_MAP[category.icon] || UtensilsCrossed;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition ${
        isChild ? "pl-11 bg-slate-50/40" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 transition p-1"
        >
          <GripVertical size={16} />
        </div>

        {/* Real Lucide SVG Icon */}
        <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-sm">
          <IconComp className="w-4 h-4" />
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm">{category.name}</p>
          {isChild && <p className="text-[11px] text-slate-400 font-medium">Danh mục con</p>}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => {
            setEditingId(category.id);
            setEditForm({
              name: category.name,
              parent_id: category.parent_id || "",
              icon: category.icon || "ChefHat",
            });
          }}
          className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-xl transition"
          title="Chỉnh sửa danh mục"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={() => handleDelete(category)}
          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition"
          title="Xóa danh mục"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function CategoryEditRow({
  isChild,
  editForm,
  setEditForm,
  onSave,
  onCancel,
  parentOptions,
  onOpenIconPicker,
}) {
  const SelectedIconComp = ICON_MAP[editForm.icon] || UtensilsCrossed;
  const currentIconInfo = CATEGORY_ICON_LIST.find((i) => i.value === editForm.icon);

  return (
    <div className={`p-4 bg-emerald-50/60 border-y border-emerald-200/70 ${isChild ? "pl-11" : ""}`}>
      <div className="flex flex-wrap items-center gap-3">
        {/* Name input */}
        <input
          value={editForm.name}
          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          placeholder="Tên danh mục..."
          className="flex-1 min-w-[150px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 text-sm font-semibold text-slate-800 shadow-sm"
          autoFocus
        />

        {/* Parent Category Select */}
        <select
          value={editForm.parent_id}
          onChange={(e) => setEditForm({ ...editForm, parent_id: e.target.value })}
          className="px-3 py-2.5 rounded-xl border border-slate-200 outline-none text-sm bg-white font-medium text-slate-700 shadow-sm"
        >
          <option value="">(Không có mục cha - Danh mục chính)</option>
          {parentOptions.map((p) => (
            <option key={p.id} value={p.id}>
              Thuộc: {p.name}
            </option>
          ))}
        </select>

        {/* Visual Icon Trigger Button */}
        <button
          type="button"
          onClick={onOpenIconPicker}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/30 transition text-sm font-semibold text-slate-800 shadow-sm"
          title="Bấm để chọn icon đẹp nhất"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0">
            <SelectedIconComp className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs max-w-[110px] truncate text-slate-700">
            {currentIconInfo?.label?.split("/")[0] || editForm.icon}
          </span>
          <ChevronDown size={14} className="text-slate-400 shrink-0" />
        </button>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition shadow-sm"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-2 text-sm font-bold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800 hover:shadow-md transition flex items-center gap-1.5 shadow-sm"
          >
            <Check size={16} />
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

function IconPickerModal({ selectedIcon, onSelect, onClose }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeGroup, setActiveGroup] = useState("Tất cả");

  const groups = ["Tất cả", "Thịt & Động vật", "Hải sản", "Món ăn", "Đồ uống", "Đặc biệt"];

  const filteredIcons = useMemo(() => {
    const rawKeyword = String(searchTerm || "").trim();
    const scored = CATEGORY_ICON_LIST
      .map((item) => {
        const matchGroup = activeGroup === "Tất cả" || item.group === activeGroup;
        if (!matchGroup) return null;

        const score = rawKeyword ? calculateSearchScore({
          name: item.label,
          code: item.value,
          description: item.group
        }, rawKeyword) : 1;

        if (score === 0) return null;
        return { item, score };
      })
      .filter(Boolean);

    if (rawKeyword) {
      scored.sort((a, b) => b.score - a.score);
    }
    return scored.map((s) => s.item);
  }, [searchTerm, activeGroup]);

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-xl h-[560px] max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border border-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Chọn biểu tượng cho danh mục</h3>
            <p className="text-xs text-slate-500">Bấm chọn icon phù hợp nhất với món ăn / thức uống</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Groups Bar */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-white shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên icon (dê, bò, heo, gà, lẩu, nướng, bia, cá...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-emerald-600 focus:bg-white transition"
              autoFocus
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {groups.map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => setActiveGroup(group)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeGroup === group
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        {/* Grid of Icons */}
        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5 auto-rows-max custom-scrollbar bg-slate-50/40 min-h-0 content-start">
          {filteredIcons.map((item) => {
            const IconComponent = ICON_MAP[item.value] || UtensilsCrossed;
            const isSelected = selectedIcon === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onSelect(item.value)}
                className={`h-[62px] min-h-[62px] flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition ${
                  isSelected
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-white border-slate-200/80 text-slate-800 hover:border-emerald-500 hover:bg-emerald-50/40"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate leading-tight">{item.label.split("/")[0]}</p>
                  <p
                    className={`text-[10px] truncate ${
                      isSelected ? "text-emerald-100" : "text-slate-400"
                    }`}
                  >
                    {item.label.split("/").slice(1).join("/") || item.value}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AdminCategoryModal;
