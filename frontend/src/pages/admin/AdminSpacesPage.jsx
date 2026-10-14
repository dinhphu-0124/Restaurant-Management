import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  ImageIcon,
  Plus,
  Trash2,
  X,
  Eye,
  Pencil,
  RefreshCw,
  Upload,
  ArrowUp,
  ArrowDown,
  Check,
  Building2,
  HelpCircle,
  GripVertical,
} from "lucide-react";

import { spaceService } from "../../services/spaceService";
import { tableService } from "../../services/tableService";
import { showAdminToast } from "../../components/admin/AdminToast";
import { removeVietnameseTones, calculateSearchScore } from "../../utils/string";
import { getCurrentUser } from "../../utils/auth";
import { canUseAction } from "../../utils/permissions";
import { BACKEND_URL } from "../../config/api";
import { socket } from "../../utils/socket";
import AdminSpaceModals from "../../components/admin/AdminSpaceModals";

function AdminSpacesPage() {
  const { globalSearch, setHeaderAction } = useOutletContext();
  const currentUser = getCurrentUser();
  const [spaces, setSpaces] = useState([]);
  const [activeTab, setActiveTab] = useState("spaces"); // "spaces" or "areas"
  const [loading, setLoading] = useState(true);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [errors, setErrors] = useState({
    label: false,
    description: false
  });
  const [formState, setFormState] = useState({
    key: "",
    label: "",
    capacity: "",
    description: "",
    detailDescription: "",
    order: 1,
    status: "active",
    images: []
  });

  // --- Area States ---
  const [areas, setAreas] = useState([]);
  const [isAddingArea, setIsAddingArea] = useState(false);
  const [areaForm, setAreaForm] = useState({ name: "", description: "" });
  const [editingArea, setEditingArea] = useState(null);
  const [areaEditForm, setAreaEditForm] = useState({ name: "", description: "" });
  const [deleteConfirmArea, setDeleteConfirmArea] = useState(null);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [deleteConfirmSpace, setDeleteConfirmSpace] = useState(null);
  const [isUrlInputOpen, setIsUrlInputOpen] = useState(false);
  const [inputImageUrl, setInputImageUrl] = useState("");

  // Helper to map DB image url to absolute backend url
  const getImgUrl = (img) => {
    if (!img) return "";
    const url = typeof img === "string" ? img : img.url || img.image || "";
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url;
    }
    if (url.startsWith("/uploads/")) {
      return `${BACKEND_URL}${url}`;
    }
    return url;
  };

  // Fetch all spaces from API
  const fetchSpaces = async () => {
    try {
      setLoading(true);
      const data = await spaceService.getAdminSpaces();
      setSpaces(data);
    } catch (error) {
      console.error("Lỗi lấy danh sách không gian:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAreas = async () => {
    try {
      const data = await tableService.getAreas();
      setAreas(data);
    } catch (error) {
      console.error("Lỗi lấy danh sách khu vực:", error);
    }
  };

  useEffect(() => {
    fetchSpaces();
    fetchAreas();
  }, []);

  const openAddArea = () => {
    setAreaForm({ name: "", description: "" });
    setIsAddingArea(true);
  };

  const saveAddArea = async () => {
    if (!areaForm.name.trim()) { showAdminToast({ title: "Thiếu thông tin", message: "Vui lòng nhập tên khu vực.", type: "warning" }); return; }
    try {
      const savedArea = await tableService.createArea({
        name: areaForm.name.trim(),
        description: areaForm.description.trim()
      });
      setAreas((prev) => [...prev, savedArea]);
      setIsAddingArea(false);
      showAdminToast({ title: "Thêm khu vực thành công", message: `Đã thêm khu vực ${savedArea.name}.` });
    } catch (error) {
      console.error(error);
      showAdminToast({ title: "Lỗi", message: error.message || "Không thể thêm khu vực.", type: "error" });
    }
  };

  const openEditArea = (area) => {
    setEditingArea(area);
    setAreaEditForm({ name: area.name, description: area.description || "" });
  };

  const saveEditArea = async () => {
    if (!editingArea || !areaEditForm.name.trim()) { showAdminToast({ title: "Thiếu thông tin", message: "Vui lòng nhập tên khu vực.", type: "warning" }); return; }
    try {
      const updatedArea = await tableService.updateArea(editingArea.id, {
        name: areaEditForm.name.trim(),
        description: areaEditForm.description.trim()
      });
      setAreas((prev) => prev.map((a) => String(a.id) === String(editingArea.id) ? updatedArea : a));
      setEditingArea(null);
      showAdminToast({ title: "Cập nhật khu vực thành công", message: `Đã cập nhật khu vực ${updatedArea.name}.` });
    } catch (error) {
      console.error(error);
      showAdminToast({ title: "Lỗi", message: error.message || "Không thể cập nhật khu vực.", type: "error" });
    }
  };

  const handleDeleteArea = async (id, name) => {
    try {
      await tableService.deleteArea(id);
      setAreas((prev) => prev.filter((a) => String(a.id) !== String(id)));
      setDeleteConfirmArea(null);
      showAdminToast({ title: "Xóa khu vực thành công", message: `Đã xóa khu vực ${name}.` });
    } catch (error) {
      console.error(error);
      showAdminToast({ title: "Lỗi", message: error.message || "Không thể xóa khu vực.", type: "error" });
    }
  };

  // Open Edit form for a specific space
  const handleEditSpace = (space) => {
    setSelectedSpace(space);
    setErrors({ label: false, description: false });
    setFormState({
      key: space.key,
      label: space.label || "",
      capacity: space.capacity || "",
      description: space.description || "",
      detailDescription: space.detailDescription || "",
      order: space.order || 1,
      status: space.status || "active",
      images: [...(space.images || [])]
    });
  };

  // Add space from pending list to active spaces list
  const handleAddToActive = async (space) => {
    try {
      const updatedSpace = {
        label: space.label,
        capacity: space.capacity,
        description: space.description,
        detailDescription: space.detailDescription,
        order: space.order,
        status: "active",
        images: space.images
      };
      await spaceService.updateSpace(space.key, updatedSpace);
      await fetchSpaces();

      // Auto select it for editing
      const latestSpaces = await spaceService.getAdminSpaces();
      const updated = latestSpaces.find((s) => s.key === space.key);
      if (updated) {
        handleEditSpace(updated);
      }
      showAdminToast({
        title: "Thành công",
        message: "Kích hoạt không gian thành công!",
        type: "success"
      });
    } catch (error) {
      showAdminToast({
        title: "Lỗi",
        message: "Kích hoạt không gian thất bại: " + error.message,
        type: "error"
      });
    }
  };

  // Trigger local add form (without API call immediately)
  const handleCreateNewSpace = () => {
    const tempKey = "new_space_temp_" + Math.random().toString(36).substring(2, 9);
    const mockSpace = {
      key: tempKey,
      label: "",
      description: "",
      capacity: "",
      detailDescription: "",
      status: "pending",
      order: spaces.length + 1,
      images: [],
      isNew: true // custom flag to detect creation vs update
    };

    setSelectedSpace(mockSpace);
    setErrors({ label: false, description: false });
    setFormState({
      key: tempKey,
      label: "",
      capacity: "",
      description: "",
      detailDescription: "",
      order: spaces.length + 1,
      status: "pending",
      images: []
    });
  };

  // Set header action dynamically based on activeTab
  useEffect(() => {
    if (canUseAction(currentUser, "tables:create")) {
      setHeaderAction({
        label: activeTab === "spaces" ? "Thêm không gian" : "Thêm khu vực",
        onClick: () => {
          if (activeTab === "spaces") {
            handleCreateNewSpace();
          } else {
            openAddArea();
          }
        },
      });
    }
    return () => setHeaderAction(null);
  }, [setHeaderAction, activeTab, spaces, currentUser?.role]);

  // Auto re-fetch when areas/spaces change from other pages (e.g. AdminTablesPage) or via realtime sockets
  useEffect(() => {
    const handleAreasUpdated = () => fetchAreas();
    const handleSpacesUpdated = () => fetchSpaces();

    window.addEventListener("areasUpdated", handleAreasUpdated);
    window.addEventListener("spacesUpdated", handleSpacesUpdated);
    socket.on("spaces_updated", handleSpacesUpdated);
    socket.on("areas_updated", handleAreasUpdated);

    return () => {
      window.removeEventListener("areasUpdated", handleAreasUpdated);
      window.removeEventListener("spacesUpdated", handleSpacesUpdated);
      socket.off("spaces_updated", handleSpacesUpdated);
      socket.off("areas_updated", handleAreasUpdated);
    };
  }, []);

  // Form image upload via Multer API
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    for (const file of files) {
      try {
        const res = await spaceService.uploadImage(file);
        const newImg = {
          id: "img_" + Math.random().toString(36).substring(2, 9),
          url: res.url,
          title: file.name.split(".")[0] || "Hình ảnh",
          description: "Mô tả hình ảnh",
          isCover: formState.images.length === 0
        };

        setFormState((prev) => ({
          ...prev,
          images: [...prev.images, newImg]
        }));
      } catch (error) {
        showAdminToast({
          title: "Lỗi",
          message: "Tải ảnh lên thất bại: " + error.message,
          type: "error"
        });
      }
    }
  };

  // Direct paste image URL
  const handleConfirmAddUrlImage = () => {
    if (!inputImageUrl || !inputImageUrl.trim()) {
      showAdminToast({
        title: "URL trống",
        message: "Vui lòng nhập đường dẫn URL ảnh hợp lệ.",
        type: "warning",
      });
      return;
    }

    const newImg = {
      id: "img_" + Math.random().toString(36).substring(2, 9),
      url: inputImageUrl.trim(),
      title: "Ảnh dán URL",
      description: "Mô tả ảnh",
      isCover: formState.images.length === 0
    };

    setFormState((prev) => ({
      ...prev,
      images: [...prev.images, newImg]
    }));
    setInputImageUrl("");
    setIsUrlInputOpen(false);
    showAdminToast({
      title: "Thành công",
      message: "Đã thêm ảnh từ URL.",
    });
  };

  // Delete image in current form state
  const handleDeleteImage = (imgId) => {
    const filtered = formState.images.filter((img) => img.id !== imgId);
    const updated = filtered.map((img, idx) => ({
      ...img,
      isCover: idx === 0 ? true : img.isCover
    }));

    setFormState((prev) => ({
      ...prev,
      images: updated
    }));
  };

  // Set image as cover
  const handleSetCover = (imgId) => {
    const updated = formState.images.map((img) => ({
      ...img,
      isCover: img.id === imgId
    }));
    setFormState((prev) => ({
      ...prev,
      images: updated
    }));
  };

  // Re-order image position in form
  const handleMoveImage = (idx, direction) => {
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= formState.images.length) return;

    const updated = [...formState.images];
    const temp = updated[idx];
    updated[idx] = updated[nextIdx];
    updated[nextIdx] = temp;

    setFormState((prev) => ({
      ...prev,
      images: updated
    }));
  };

  // Update specific field inside image description table
  const handleUpdateImageInfo = (imgId, field, value) => {
    const updated = formState.images.map((img) =>
      img.id === imgId ? { ...img, [field]: value } : img
    );
    setFormState((prev) => ({
      ...prev,
      images: updated
    }));
  };

  // Save changes from formState back to overall spaces list
  const handleSaveForm = async (e) => {
    e.preventDefault();
    const hasLabelError = !formState.label.trim();
    const hasDescError = !formState.description.trim();

    if (hasLabelError || hasDescError) {
      setErrors({
        label: hasLabelError,
        description: hasDescError
      });
      showAdminToast({
        title: "Cảnh báo",
        message: "Vui lòng điền đầy đủ các thông tin bắt buộc!",
        type: "warning"
      });
      return;
    }

    try {
      const payload = {
        label: formState.label.trim(),
        capacity: Number(formState.capacity) || 0,
        description: formState.description.trim(),
        detailDescription: formState.detailDescription.trim(),
        order: Number(formState.order) || 1,
        status: formState.status,
        images: formState.images
      };

      if (selectedSpace.isNew) {
        const randomKey = "space_" + Math.random().toString(36).substring(2, 9);
        await spaceService.createSpace({
          ...payload,
          key: randomKey,
          status: "pending" // Always save new spaces as pending initially
        });
        showAdminToast({
          title: "Thành công",
          message: "Tạo không gian mới vào hàng chờ thành công!",
          type: "success"
        });
      } else {
        await spaceService.updateSpace(formState.key, payload);
        showAdminToast({
          title: "Thành công",
          message: "Lưu không gian thành công!",
          type: "success"
        });
      }
      await fetchSpaces();
      window.dispatchEvent(new Event("spacesUpdated"));
      setSelectedSpace(null);
    } catch (error) {
      showAdminToast({
        title: "Lỗi",
        message: "Lưu không gian thất bại: " + error.message,
        type: "error"
      });
    }
  };

  // Group active and pending spaces
  const activeSpaces = spaces.filter((s) => s.status !== "pending").sort((a, b) => a.order - b.order);
  const pendingSpaces = spaces.filter((s) => s.status === "pending");

  // Filter based on globalSearch keyword
  const searchKeyword = String(globalSearch || "").trim();

  const filteredActiveSpaces = useMemo(() => {
    if (!searchKeyword) return activeSpaces;
    return activeSpaces
      .map((space) => {
        const score = calculateSearchScore({
          label: space.label || space.name,
          name: space.label || space.name,
          description: `${space.description || ""} ${space.detailDescription || ""} ${space.capacity || ""}`
        }, searchKeyword);
        return { space, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.space);
  }, [activeSpaces, searchKeyword]);

  const filteredPendingSpaces = useMemo(() => {
    if (!searchKeyword) return pendingSpaces;
    return pendingSpaces
      .map((space) => {
        const score = calculateSearchScore({
          label: space.label || space.name,
          name: space.label || space.name,
          description: space.description || ""
        }, searchKeyword);
        return { space, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.space);
  }, [pendingSpaces, searchKeyword]);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("spaces")}
          className={`px-6 py-3 text-sm font-black border-b-2 transition ${activeTab === "spaces"
            ? "border-green-800 text-green-800"
            : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
        >
          Không gian
        </button>
        <button
          onClick={() => setActiveTab("areas")}
          className={`px-6 py-3 text-sm font-black border-b-2 transition ${activeTab === "areas"
            ? "border-green-800 text-green-800"
            : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
        >
          Khu vực
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-2">
          <RefreshCw className="animate-spin text-primary" size={24} />
          <p className="text-xs font-bold">Đang tải dữ liệu...</p>
        </div>
      ) : activeTab === "spaces" ? (
        <div className={`grid grid-cols-1 ${selectedSpace ? "lg:grid-cols-[1.15fr_0.85fr]" : "lg:grid-cols-1"} gap-5 items-stretch`}>

          {/* LEFT COLUMN: Current & Pending list */}
          <div className="space-y-6 flex flex-col h-full min-w-0">
            {/* Box 1: Danh sách không gian hiện tại */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex-1 flex flex-col">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-primary" />
                  <h3 className="text-base font-black text-primary uppercase tracking-wide">
                    Danh sách không gian hiện tại
                  </h3>
                </div>
              </div>

              {/* MOBILE CARDS (< md) */}
              <div className="block md:hidden divide-y divide-gray-100">
                {filteredActiveSpaces.map((space, index) => {
                  const coverImg = space.images?.find((img) => img.isCover)?.url || space.images?.[0]?.url || "";
                  const isSelected = selectedSpace?.key === space.key;

                  return (
                    <div
                      key={space.key}
                      onClick={() => handleEditSpace(space)}
                      className={`p-4 space-y-3 cursor-pointer transition ${isSelected ? "bg-green-50/40" : "hover:bg-slate-50"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-14 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                          {coverImg ? (
                            <img src={getImgUrl(coverImg)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <ImageIcon size={18} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-black text-slate-900 text-sm truncate">{space.label || "(Không gian mới)"}</p>
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${space.status === "active"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-gray-100 text-gray-500 border border-gray-200"
                                }`}
                            >
                              {space.status === "active" ? "Hiển thị" : "Ẩn"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                            {space.description || "Chưa có mô tả"}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-gray-400 font-semibold mt-1">
                            <span>{space.images?.length || 0} ảnh</span>
                            <span>•</span>
                            <span>Thứ tự: {space.order}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-50">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSpace(space);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 flex items-center gap-1.5 transition"
                        >
                          <Pencil size={13} /> Sửa
                        </button>
                        {canUseAction(currentUser, "tables:delete") && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmSpace(space);
                            }}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                            title="Xóa không gian"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredActiveSpaces.length === 0 && (
                  <div className="p-8 text-center text-xs font-bold text-gray-400">Không có không gian nào</div>
                )}
              </div>

              {/* DESKTOP TABLE (>= md) */}
              <div className="hidden md:block overflow-x-auto relative w-full">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-bold whitespace-nowrap">
                      <th className="p-3.5 text-center w-12">STT</th>
                      <th className="p-3.5">Tên không gian</th>
                      <th className="p-3.5 text-center">Trạng thái</th>
                      <th className="p-3.5 text-center">Số ảnh</th>
                      <th className="p-3.5 text-center">Thứ tự</th>
                      <th className="p-3.5 text-right sticky right-0 bg-gray-50/95 backdrop-blur-sm z-20 shadow-[-8px_0_8px_-6px_rgba(0,0,0,0.05)] w-24">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredActiveSpaces.map((space, index) => {
                      const coverImg = space.images?.find((img) => img.isCover)?.url || space.images?.[0]?.url || "";
                      const isSelected = selectedSpace?.key === space.key;

                      return (
                        <tr
                          key={space.key}
                          onClick={() => handleEditSpace(space)}
                          className={`hover:bg-green-50/20 transition cursor-pointer whitespace-nowrap ${isSelected ? "bg-green-50/40" : ""
                            }`}
                        >
                          <td className="p-3.5 text-center font-bold text-gray-400">{index + 1}</td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-11 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                                {coverImg ? (
                                  <img src={getImgUrl(coverImg)} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <ImageIcon size={16} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-black text-gray-900 leading-snug">{space.label || "(Không gian mới)"}</p>
                                <p className="text-[11px] text-gray-500 truncate max-w-[200px] mt-0.5">
                                  {space.description || "Chưa có mô tả ngắn"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black ${space.status === "active"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-gray-100 text-gray-500 border border-gray-200"
                                }`}
                            >
                              {space.status === "active" ? "Đang hiển thị" : "Đang ẩn"}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-bold text-gray-700">
                            {space.images?.length || 0} ảnh
                          </td>
                          <td className="p-3.5 text-center font-bold text-gray-900">{space.order}</td>
                          <td className={`p-3.5 text-right sticky right-0 z-10 transition shadow-[-8px_0_8px_-6px_rgba(0,0,0,0.08)] ${isSelected ? "bg-green-50/40" : "bg-white"}`}>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditSpace(space);
                                }}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${isSelected
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  }`}
                                title="Chỉnh sửa không gian"
                              >
                                <Pencil size={14} />
                              </button>
                              {canUseAction(currentUser, "tables:delete") && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmSpace(space);
                                  }}
                                  className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition"
                                  title="Xóa không gian"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Box 2: Không gian chờ thêm vào */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2 bg-yellow-50/30">
                <Building2 size={18} className="text-amber-600" />
                <h3 className="text-base font-black text-amber-900 uppercase tracking-wide">
                  Không gian chờ thêm vào
                </h3>
              </div>

              <div className="p-4 bg-amber-50/40 border-b border-gray-100 flex items-start gap-2.5">
                <HelpCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-semibold leading-relaxed">
                  Các không gian dưới đây chưa được hiển thị trên menu chính. Bạn có thể kích hoạt bằng cách chọn "Thêm vào không gian" bên dưới để điền đầy đủ các hình ảnh thực tế.
                </p>
              </div>

              {filteredPendingSpaces.length === 0 ? (
                <div className="p-6 text-center text-gray-400 font-medium text-sm">
                  Không còn không gian chờ kích hoạt nào.
                </div>
              ) : (
                <>
                  {/* MOBILE CARDS (< md) */}
                  <div className="block md:hidden divide-y divide-gray-100">
                    {filteredPendingSpaces.map((space, index) => {
                      const coverImg = space.images?.[0]?.url || "";
                      const isSelected = selectedSpace?.key === space.key;

                      return (
                        <div
                          key={space.key}
                          onClick={() => handleEditSpace(space)}
                          className={`p-4 space-y-3 cursor-pointer transition ${isSelected ? "bg-amber-50/20" : "hover:bg-slate-50"}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-14 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                              {coverImg ? (
                                <img src={getImgUrl(coverImg)} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <ImageIcon size={18} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-slate-900 text-sm truncate">{space.label || "(Không gian mới)"}</p>
                              <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{space.description || "Chưa có mô tả"}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-50">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSpace(space);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 flex items-center gap-1.5 transition"
                            >
                              <Pencil size={13} /> Sửa
                            </button>
                            {canUseAction(currentUser, "tables:delete") && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmSpace(space);
                                }}
                                className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                                title="Xóa không gian chờ"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToActive(space);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-green-800 text-white text-xs font-black hover:bg-green-950 transition shadow-sm"
                            >
                              Thêm
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* DESKTOP TABLE (>= md) */}
                  <div className="hidden md:block overflow-x-auto relative w-full">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-bold whitespace-nowrap">
                          <th className="p-3.5 text-center w-12">STT</th>
                          <th className="p-3.5">Tên không gian</th>
                          <th className="p-3.5">Mô tả chờ</th>
                          <th className="p-3.5 text-right sticky right-0 bg-gray-50/95 backdrop-blur-sm z-20 shadow-[-8px_0_8px_-6px_rgba(0,0,0,0.05)] w-24">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredPendingSpaces.map((space, index) => {
                          const coverImg = space.images?.[0]?.url || "";
                          const isSelected = selectedSpace?.key === space.key;

                          return (
                            <tr
                              key={space.key}
                              onClick={() => handleEditSpace(space)}
                              className={`hover:bg-amber-50/10 transition cursor-pointer whitespace-nowrap ${isSelected ? "bg-amber-50/20" : ""
                                }`}
                            >
                              <td className="p-3.5 text-center font-bold text-gray-400">{index + 1}</td>
                              <td className="p-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-14 h-11 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                                    {coverImg ? (
                                      <img src={getImgUrl(coverImg)} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <ImageIcon size={16} />
                                      </div>
                                    )}
                                  </div>
                                  <span className="font-black text-gray-900">{space.label || "(Không gian mới)"}</span>
                                </div>
                              </td>
                              <td className="p-3.5 text-gray-500">{space.description}</td>
                              <td className={`p-3.5 text-right sticky right-0 z-10 transition shadow-[-8px_0_8px_-6px_rgba(0,0,0,0.08)] ${isSelected ? "bg-amber-50/20" : "bg-white"}`}>
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditSpace(space);
                                    }}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${isSelected
                                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                      }`}
                                    title="Chỉnh sửa không gian chờ"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  {canUseAction(currentUser, "tables:delete") && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirmSpace(space);
                                      }}
                                      className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition"
                                      title="Xóa không gian chờ"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddToActive(space);
                                    }}
                                    className="px-3 py-2 rounded-xl bg-green-800 text-white text-xs font-black hover:bg-green-950 transition shadow-sm"
                                  >
                                    Thêm vào không gian
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Form Add/Edit space details */}
          {selectedSpace && (
            <div className="lg:sticky lg:top-4 h-full flex flex-col min-w-0">
              <form
                onSubmit={handleSaveForm}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-5 h-full flex flex-col justify-between"
              >
                {/* Form Header */}
                <div className="flex items-center justify-between border-b pb-4 mb-2">
                  <div>
                    <h3 className="text-base font-black text-primary flex items-center gap-1.5">
                      <Pencil size={18} className="text-green-700" />
                      {selectedSpace.isNew ? "Thêm không gian mới" : "Chỉnh sửa không gian"}
                    </h3>
                    <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                      {selectedSpace.isNew ? "Điền chi tiết không gian mới" : `Đang thiết lập khu vực: ${formState.label}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSpace(null)}
                    className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Section 1: Thông tin không gian */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-green-900 border-l-4 border-green-800 pl-2 uppercase tracking-wide">
                    Thông tin không gian
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Tên không gian <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formState.label}
                        onChange={(e) => {
                          setFormState((prev) => ({ ...prev, label: e.target.value }));
                          if (errors.label) setErrors((prev) => ({ ...prev, label: false }));
                        }}
                        placeholder="VD: Tầng lửng, Phòng tiệc..."
                        className={`w-full h-10 px-3 rounded-xl border bg-gray-50/50 text-xs font-semibold text-gray-900 focus:bg-white outline-none transition ${errors.label
                          ? "border-red-500 bg-red-50/10 focus:border-red-500"
                          : "border-gray-200 focus:border-green-800"
                          }`}
                      />
                      {errors.label && (
                        <p className="text-[10px] text-red-500 font-bold mt-1">
                          Vui lòng điền vào trường này.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Sức chứa (người)
                      </label>
                      <input
                        type="number"
                        value={formState.capacity}
                        onChange={(e) => setFormState((prev) => ({ ...prev, capacity: e.target.value }))}
                        placeholder="VD: 50"
                        className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-900 focus:bg-white focus:border-green-800 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Mô tả ngắn <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formState.description}
                      onChange={(e) => {
                        setFormState((prev) => ({ ...prev, description: e.target.value }));
                        if (errors.description) setErrors((prev) => ({ ...prev, description: false }));
                      }}
                      placeholder="VD: Không gian mở ngoài trời..."
                      className={`w-full h-10 px-3 rounded-xl border bg-gray-50/50 text-xs font-semibold text-gray-900 focus:bg-white outline-none transition ${errors.description
                        ? "border-red-500 bg-red-50/10 focus:border-red-500"
                        : "border-gray-200 focus:border-green-800"
                        }`}
                    />
                    {errors.description && (
                      <p className="text-[10px] text-red-500 font-bold mt-1">
                        Vui lòng điền vào trường này.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Mô tả chi tiết
                    </label>
                    <textarea
                      rows={3}
                      value={formState.detailDescription}
                      onChange={(e) => setFormState((prev) => ({ ...prev, detailDescription: e.target.value }))}
                      placeholder="Giới thiệu chi tiết thiết kế..."
                      className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-900 focus:bg-white focus:border-green-800 outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Vị trí hiển thị (thứ tự)
                      </label>
                      <input
                        type="number"
                        value={formState.order}
                        onChange={(e) => setFormState((prev) => ({ ...prev, order: Number(e.target.value) }))}
                        className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-900 focus:bg-white focus:border-green-800 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Trạng thái
                      </label>
                      <select
                        value={formState.status}
                        onChange={(e) => setFormState((prev) => ({ ...prev, status: e.target.value }))}
                        className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-900 focus:bg-white focus:border-green-800 outline-none"
                      >
                        <option value="active">Hiển thị</option>
                        <option value="pending">Chờ kích hoạt</option>
                        <option value="inactive">Ẩn</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Hình ảnh không gian */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-emerald-900 border-l-4 border-emerald-800 pl-2 uppercase tracking-wide">
                      Hình ảnh không gian
                    </h4>
                    {!isUrlInputOpen && (
                      <button
                        type="button"
                        onClick={() => setIsUrlInputOpen(true)}
                        className="text-[11px] font-bold text-emerald-800 hover:text-emerald-900 hover:underline"
                      >
                        + Dán URL ảnh
                      </button>
                    )}
                  </div>

                  {isUrlInputOpen && (
                    <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl animate-in fade-in duration-150">
                      <input
                        type="url"
                        placeholder="Dán đường dẫn URL ảnh (https://...)..."
                        value={inputImageUrl}
                        onChange={(e) => setInputImageUrl(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:border-emerald-600"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleConfirmAddUrlImage}
                        className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition"
                      >
                        Thêm
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsUrlInputOpen(false);
                          setInputImageUrl("");
                        }}
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition"
                      >
                        Hủy
                      </button>
                    </div>
                  )}

                  {/* Upload Dotted Area */}
                  <div className="relative group border-2 border-dashed border-gray-200 hover:border-green-800 bg-gray-50/50 rounded-2xl p-5 text-center cursor-pointer transition">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload size={24} className="mx-auto text-gray-400 group-hover:text-primary transition mb-2" />
                    <p className="text-xs font-bold text-gray-600">Kéo thả ảnh vào đây hoặc</p>
                    <p className="text-[11px] font-black text-primary mt-1">Chọn ảnh từ máy</p>
                  </div>

                  {/* Lưới thumbnail ảnh đã thêm */}
                  {formState.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {formState.images.map((img, idx) => (
                        <div
                          key={img.id}
                          className="group relative h-16 rounded-xl overflow-hidden border border-gray-200 bg-gray-100"
                        >
                          <img src={getImgUrl(img.url)} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewUrl(getImgUrl(img.url))}
                              className="text-white hover:text-green-400"
                              title="Xem phóng to ảnh"
                            >
                              <Eye size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(img.id)}
                              className="text-white hover:text-red-400"
                              title="Xóa ảnh này"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          {/* Index Badge */}
                          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/50 text-[9px] text-white flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          {/* Cover Label */}
                          {img.isCover && (
                            <span className="absolute bottom-1 left-1 bg-green-800 text-white text-[8px] font-bold px-1 rounded-sm shadow-sm scale-90 origin-bottom-left">
                              Bìa
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 3: Danh sách ảnh & mô tả */}
                {formState.images.length > 0 && (
                  <div className="space-y-3 pt-3 border-t">
                    <h4 className="text-xs font-black text-green-900 border-l-4 border-green-800 pl-2 uppercase tracking-wide">
                      Danh sách ảnh & mô tả
                    </h4>

                    <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                      {formState.images.map((img, idx) => (
                        <div
                          key={img.id}
                          className="flex gap-2.5 p-2 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition items-start"
                        >
                          {/* Grip & Thumbnail */}
                          <div className="flex flex-col items-center gap-2 shrink-0">
                            <GripVertical size={14} className="text-gray-300 cursor-grab" />
                            <span className="text-[10px] font-bold text-gray-400">#{idx + 1}</span>
                          </div>

                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-gray-50">
                            <img src={getImgUrl(img.url)} alt="" className="w-full h-full object-cover" />
                          </div>

                          {/* Title & Desc Inputs */}
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <input
                              type="text"
                              value={img.title}
                              onChange={(e) => handleUpdateImageInfo(img.id, "title", e.target.value)}
                              placeholder="Tiêu đề ảnh..."
                              className="w-full h-7 px-2 rounded-lg border border-gray-200 bg-white text-[10px] font-bold text-gray-900 focus:border-green-800 outline-none"
                            />
                            <input
                              type="text"
                              value={img.description || ""}
                              onChange={(e) => handleUpdateImageInfo(img.id, "description", e.target.value)}
                              placeholder="Mô tả ảnh ngắn..."
                              className="w-full h-7 px-2 rounded-lg border border-gray-200 bg-white text-[9px] font-medium text-gray-600 focus:border-green-800 outline-none"
                            />
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            {img.isCover ? (
                              <span className="text-[9px] font-black text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">
                                Ảnh bìa
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetCover(img.id)}
                                className="text-[9px] font-bold text-gray-400 hover:text-primary hover:underline"
                                title="Đặt làm ảnh bìa"
                              >
                                Đặt bìa
                              </button>
                            )}
                            <div className="flex gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveImage(idx, -1)}
                                className="p-1 rounded-md hover:bg-gray-200 text-gray-400 disabled:opacity-30"
                                title="Di chuyển ảnh lên trên"
                              >
                                <ArrowUp size={11} />
                              </button>
                              <button
                                type="button"
                                disabled={idx === formState.images.length - 1}
                                onClick={() => handleMoveImage(idx, 1)}
                                className="p-1 rounded-md hover:bg-gray-200 text-gray-400 disabled:opacity-30"
                                title="Di chuyển ảnh xuống dưới"
                              >
                                <ArrowDown size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteImage(img.id)}
                                className="p-1 rounded-md hover:bg-red-50 text-red-500"
                                title="Xóa ảnh này"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setSelectedSpace(null)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-green-800 text-white font-bold text-xs hover:bg-green-950 transition shadow-sm"
                  >
                    Lưu & hiển thị
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : (
        /* Areas Tab Content */
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-4 sm:p-5">
          {/* MOBILE CARDS (< md) */}
          <div className="block md:hidden divide-y divide-gray-100">
            {areas.map((area, index) => (
              <div key={area.id} className="py-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-gray-900">{area.name}</span>
                  <div className="flex items-center gap-1.5">
                    {canUseAction(currentUser, "tables:update") && (
                      <button
                        type="button"
                        onClick={() => openEditArea(area)}
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                        title="Chỉnh sửa khu vực"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {canUseAction(currentUser, "tables:delete") && (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmArea(area)}
                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                        title="Xóa khu vực"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 font-medium">{area.description || "Chưa có mô tả"}</p>
              </div>
            ))}
            {areas.length === 0 && (
              <div className="py-8 text-center text-xs font-bold text-gray-400">Chưa có khu vực nào</div>
            )}
          </div>

          {/* DESKTOP TABLE (>= md) */}
          <div className="hidden md:block overflow-x-auto relative w-full">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-bold whitespace-nowrap">
                  <th className="p-3.5 text-center w-12">STT</th>
                  <th className="p-3.5">Tên khu vực</th>
                  <th className="p-3.5">Mô tả</th>
                  <th className="p-3.5 text-right w-24">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {areas.map((area, index) => (
                  <tr key={area.id} className="hover:bg-green-50/20 transition whitespace-nowrap">
                    <td className="p-3.5 text-center font-bold text-gray-400">{index + 1}</td>
                    <td className="p-3.5 font-black text-gray-900">{area.name}</td>
                    <td className="p-3.5 text-gray-500 font-semibold">{area.description || "Chưa có mô tả"}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canUseAction(currentUser, "tables:update") && (
                          <button
                            onClick={() => openEditArea(area)}
                            className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center transition"
                            title="Chỉnh sửa khu vực"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {canUseAction(currentUser, "tables:delete") && (
                          <button
                            onClick={() => setDeleteConfirmArea(area)}
                            className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition"
                            title="Xóa khu vực"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Full-screen Photo Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 font-bold text-xs flex items-center gap-1"
            >
              <X size={18} /> Đóng
            </button>
            <img
              src={previewUrl}
              alt=""
              className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl bg-black"
            />
          </div>
        </div>
      )}
      {/* Custom centered Delete Confirmation Modal */}
      {deleteConfirmSpace && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 max-w-sm w-full text-center space-y-4 animate-[scaleIn_0.2s_ease-out]">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 size={28} />
            </div>
            <div>
              <h4 className="font-black text-gray-900 text-base">Xác nhận xóa không gian</h4>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Bạn có chắc chắn muốn xóa không gian <span className="font-bold text-gray-800">"{deleteConfirmSpace.label || "Không gian mới"}"</span>? Hành động này sẽ xóa tất cả hình ảnh liên quan và không thể khôi phục.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmSpace(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={async () => {
                  const space = deleteConfirmSpace;
                  setDeleteConfirmSpace(null);
                  try {
                    await spaceService.deleteSpace(space.key);
                    await fetchSpaces();
                    if (selectedSpace?.key === space.key) setSelectedSpace(null);
                    window.dispatchEvent(new Event("spacesUpdated"));
                    showAdminToast({
                      title: "Thành công",
                      message: "Đã xóa không gian thành công!",
                      type: "success"
                    });
                  } catch (error) {
                    showAdminToast({
                      title: "Lỗi",
                      message: "Xóa không gian thất bại: " + error.message,
                      type: "error"
                    });
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition shadow-sm"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Area Modals */}
      <AdminSpaceModals
        isAddingArea={isAddingArea} setIsAddingArea={setIsAddingArea}
        areaForm={areaForm} setAreaForm={setAreaForm} saveAddArea={saveAddArea}
        isAddingTable={false} setIsAddingTable={() => { }}
        tableForm={{}} setTableForm={() => { }} areas={areas} saveAddTable={() => { }}
        editingArea={editingArea} setEditingArea={setEditingArea}
        areaEditForm={areaEditForm} setAreaEditForm={setAreaEditForm} saveEditArea={saveEditArea}
        deleteConfirmArea={deleteConfirmArea} setDeleteConfirmArea={setDeleteConfirmArea} handleDeleteArea={handleDeleteArea}
        editingTable={null} setEditingTable={() => { }}
        tableEditForm={{}} setTableEditForm={() => { }} saveEditTable={() => { }}
      />
    </div>
  );
}

export default AdminSpacesPage;
