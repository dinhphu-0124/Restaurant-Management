import { useState, useEffect } from "react";
import { tableService } from "../services/tableService";
import { bookingService } from "../services/bookingService";
import { socket } from "./socket";
import { sortAreasByPriority } from "./tableHelpers";
import { showAdminToast } from "../components/admin/AdminToast";

/**
 * Custom hook quản lý toàn bộ logic dữ liệu của trang quản lý bàn:
 * - Load/reload danh sách bàn, khu vực, đặt bàn
 * - Lắng nghe socket/events để cập nhật realtime
 */
export function useTablesData({ today }) {
  const [areas, setAreas] = useState([]);
  const [tables, setTables] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [selectedArea, setSelectedArea] = useState("");
  const [assignForm, setAssignForm] = useState({ areaId: "", tableCode: "" });
  const [addForm, setAddForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    date: today,
    time: "",
    guests: 1,
    selectedArea: "",
    selectedAreaTitle: "",
    selectedTable: "",
    note: "",
    status: "pending",
  });

  const loadTableLayout = async () => {
    setTableLoading(true);
    try {
      const [apiAreas, apiTables] = await Promise.all([
        tableService.getAreas(),
        tableService.getTables(),
      ]);
      const sortedAreas = sortAreasByPriority(apiAreas);
      setAreas(sortedAreas);
      setTables(apiTables);
      const firstArea = sortedAreas[0];
      setSelectedArea((prev) => {
        const existed = sortedAreas.some((area) => String(area.id) === String(prev));
        return existed ? prev : firstArea?.id || "";
      });
      setAssignForm((prev) => {
        const existed = sortedAreas.some((area) => String(area.id) === String(prev.areaId));
        return {
          ...prev,
          areaId: existed ? prev.areaId : firstArea?.id || "",
          tableCode: existed ? prev.tableCode : "",
        };
      });
      setAddForm((prev) => {
        const existedArea = sortedAreas.find((area) => String(area.id) === String(prev.selectedArea));
        const nextArea = existedArea || firstArea;
        return {
          ...prev,
          selectedArea: nextArea?.id || "",
          selectedAreaTitle: nextArea?.name || "",
          selectedTable: existedArea ? prev.selectedTable : "",
        };
      });
    } catch (error) {
      console.error(error);
      showAdminToast({ title: "Lỗi", message: error.message || "Không thể tải danh sách bàn/khu vực.", type: "error" });
    } finally {
      setTableLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const apiBookings = await bookingService.getBookings();
      setBookings(apiBookings);
    } catch (error) {
      console.error(error);
      setBookings([]);
    }
  };

  useEffect(() => {
    loadTableLayout();
    window.addEventListener("tablesUpdated", loadTableLayout);
    window.addEventListener("areasUpdated", loadTableLayout);
    socket.on("table_updated", loadTableLayout);
    return () => {
      window.removeEventListener("tablesUpdated", loadTableLayout);
      window.removeEventListener("areasUpdated", loadTableLayout);
      socket.off("table_updated", loadTableLayout);
    };
  }, []);

  useEffect(() => {
    loadBookings();
    window.addEventListener("bookingsUpdated", loadBookings);
    return () => window.removeEventListener("bookingsUpdated", loadBookings);
  }, []);

  return {
    areas, setAreas,
    tables, setTables,
    tableLoading,
    bookings, setBookings,
    selectedArea, setSelectedArea,
    assignForm, setAssignForm,
    addForm, setAddForm,
    loadTableLayout,
    loadBookings,
  };
}
