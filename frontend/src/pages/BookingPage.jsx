import { checkLogin, clearAuthSession, getCurrentUser } from "../utils/auth";
import { useEffect, useState, useRef, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { tableService } from "../services/tableService";
import { bookingService } from "../services/bookingService";
import { spaceService } from "../services/spaceService";
import { socket } from "../utils/socket";
import { BACKEND_URL, getImageUrl } from "../config/api";
import SEO from "../components/common/SEO";

import LoginRequiredModal from "../components/LoginRequiredModal";
import AppBadge from "../components/ui/AppBadge";
import { showAdminToast } from "../components/admin/AdminToast";

import goatIcon from "../assets/images/Icon_De.png";

import {
  CalendarDays,
  Clock,
  Users,
  Phone,
  Mail,
  User,
  ShieldCheck,
  ChefHat,
  Headset,
  Sparkles,
  Info,
  Check,
} from "lucide-react";

// Hàm chuẩn hóa tiếng Việt
const removeVietnameseTones = (str = "") =>
  String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

const getAreaPriority = (area) => {
  const name = removeVietnameseTones(area.title || area.name || "");
  if (name.includes("vip")) return 0;
  const floorMatch = name.match(/tang\s*(\d+)/);
  if (floorMatch) return Number(floorMatch[1]);
  if (name.includes("tret")) return 1;
  return 99;
};

const sortAreasByPriority = (areas = []) => {
  return [...areas].sort((a, b) => {
    const priorityA = getAreaPriority(a);
    const priorityB = getAreaPriority(b);
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return String(a.title || a.name || "").localeCompare(
      String(b.title || b.name || ""),
      "vi",
      { numeric: true },
    );
  });
};

function BookingPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const location = useLocation();

  // Nút xác nhận đặt bàn: Theo dõi xem nút có sẵn trong trang có đang hiển thị trong khung nhìn không
  const [submitButtonEl, setSubmitButtonEl] = useState(null);
  const [isInlineButtonVisible, setIsInlineButtonVisible] = useState(false);

  useEffect(() => {
    if (!submitButtonEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInlineButtonVisible(entry.isIntersecting);
      },
      {
        root: null,
        // Dịch margin dưới -60px để nút cố định mượt mà chuyển đổi khi lướt tới
        rootMargin: "0px 0px -60px 0px",
        threshold: 0.05,
      }
    );

    observer.observe(submitButtonEl);

    return () => {
      observer.disconnect();
    };
  }, [submitButtonEl]);

  const selectedDish = location.state?.selectedDish;
  const bookingCartItems = location.state?.cartItems || [];

  const subtotal = bookingCartItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );
  const totalBookingQty = bookingCartItems.reduce(
    (sum, item) => sum + item.qty,
    0,
  );

  useEffect(() => {
    const updateLoginStatus = () => {
      const logged = checkLogin();
      setIsLoggedIn(logged);
      if (logged) {
        const user = getCurrentUser();
        if (user) {
          setForm((prev) => ({
            ...prev,
            name: prev.name || user.fullName || user.name || "",
            phone: prev.phone || user.phone || "",
            email: prev.email || user.email || "",
          }));
        }
      }
    };

    updateLoginStatus();
    window.addEventListener("loginStatusChanged", updateLoginStatus);
    window.addEventListener("storage", updateLoginStatus);

    return () => {
      window.removeEventListener("loginStatusChanged", updateLoginStatus);
      window.removeEventListener("storage", updateLoginStatus);
    };
  }, []);

  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem("bookingForm");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          name: parsed.name || "",
          phone: parsed.phone || "",
          email: parsed.email || "",
          date: parsed.date || "",
          time: parsed.time || "",
          guests: parsed.guests || "",
          note: parsed.note || "",
        };
      }
    } catch (e) {
      console.error("Lỗi đọc bookingForm từ localStorage:", e);
    }
    return {
      name: "",
      phone: "",
      email: "",
      date: "",
      time: "",
      guests: "",
      note: "",
    };
  });

  const [errors, setErrors] = useState({});
  const [areas, setAreas] = useState([]);
  const [adminTables, setAdminTables] = useState([]);
  const [bookings, setBookings] = useState([]);

  const maxTableCapacity = useMemo(() => {
    if (!adminTables || adminTables.length === 0) return 30;
    return Math.max(...adminTables.map((t) => Number(t.capacity || 0)));
  }, [adminTables]);

  const [selectedArea, setSelectedArea] = useState(() => {
    return localStorage.getItem("bookingSelectedArea") || "";
  });
  const [selectedTable, setSelectedTable] = useState(() => {
    return localStorage.getItem("bookingSelectedTable") || "";
  });

  const isSubmittedRef = useRef(false);

  useEffect(() => {
    if (isSubmittedRef.current) return;
    localStorage.setItem("bookingForm", JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    if (isSubmittedRef.current) return;
    if (selectedArea) {
      localStorage.setItem("bookingSelectedArea", selectedArea);
    } else {
      localStorage.removeItem("bookingSelectedArea");
    }
  }, [selectedArea]);

  useEffect(() => {
    if (isSubmittedRef.current) return;
    if (selectedTable) {
      localStorage.setItem("bookingSelectedTable", selectedTable);
    } else {
      localStorage.removeItem("bookingSelectedTable");
    }
  }, [selectedTable]);

  const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

  useEffect(() => {
    const loadTableData = async () => {
      try {
        let activeSpaces = [];
        try {
          activeSpaces = await spaceService.getActiveSpaces();
        } catch (spaceErr) {
          console.warn("Không thể tải hình ảnh không gian:", spaceErr);
        }

        const [apiAreas, apiTables] = await Promise.all([
          tableService.getAreas(),
          tableService.getTables(),
        ]);

        const mappedAreas = sortAreasByPriority(
          apiAreas.map((area) => {
            const matchedSpace = activeSpaces.find(
              (space) =>
                String(space.label || "").toLowerCase().trim() ===
                String(area.name || "").toLowerCase().trim()
            );

            let spaceImg = "";
            if (matchedSpace && matchedSpace.images && matchedSpace.images.length > 0) {
              const coverImg = matchedSpace.images.find((img) => img.isCover);
              spaceImg = coverImg ? coverImg.url : matchedSpace.images[0].url;
            }

            return {
              id: String(area.id),
              title: area.name,
              text: area.description,
              image: spaceImg || area.image || area.imageUrl || "",
            };
          }),
        );

        const mappedTables = apiTables.map((table) => ({
          ...table,
          id: String(table.id),
          areaId: String(table.areaId),
          code: String(table.code || table.tableCode),
          capacity: Number(table.capacity || table.seats || 4),
          status: table.status || "available",
        }));

        setAreas(mappedAreas);
        setAdminTables(mappedTables);

        const firstArea = mappedAreas[0];
        if (!firstArea) {
          setSelectedArea("");
          setSelectedTable("");
          return;
        }

        setSelectedArea((prev) => {
          const existed = mappedAreas.some(
            (area) => String(area.id) === String(prev),
          );
          return existed ? prev : firstArea.id;
        });

        setSelectedTable((prevTable) => {
          if (prevTable) return prevTable;
          const firstAvailableTable = mappedTables.find(
            (table) =>
              String(table.areaId) === String(firstArea.id) &&
              table.status !== "serving" &&
              table.status !== "maintenance" &&
              table.status !== "disabled",
          );
          return firstAvailableTable?.code || "";
        });
      } catch (error) {
        console.error(error);
        setAreas([]);
        setAdminTables([]);
        setSelectedArea("");
        setSelectedTable("");
      }
    };

    loadTableData();

    window.addEventListener("tablesUpdated", loadTableData);
    window.addEventListener("areasUpdated", loadTableData);
    window.addEventListener("spacesUpdated", loadTableData);
    socket.on("table_updated", loadTableData);
    socket.on("spaces_updated", loadTableData);
    socket.on("areas_updated", loadTableData);

    return () => {
      window.removeEventListener("tablesUpdated", loadTableData);
      window.removeEventListener("areasUpdated", loadTableData);
      window.removeEventListener("spacesUpdated", loadTableData);
      socket.off("table_updated", loadTableData);
      socket.off("spaces_updated", loadTableData);
      socket.off("areas_updated", loadTableData);
    };
  }, []);

  useEffect(() => {
    const loadBookingAvailability = async () => {
      if (!form.date) {
        setBookings([]);
        return;
      }

      try {
        const bookedTables = await bookingService.getBookingAvailability(
          form.date,
        );
        setBookings(Array.isArray(bookedTables) ? bookedTables : []);
      } catch (error) {
        console.error(error);
        setBookings([]);
      }
    };

    loadBookingAvailability();
    window.addEventListener("bookingsUpdated", loadBookingAvailability);

    return () => {
      window.removeEventListener("bookingsUpdated", loadBookingAvailability);
    };
  }, [form.date]);

  const currentArea = areas.find(
    (area) => String(area.id) === String(selectedArea),
  );

  const currentTables = adminTables
    .filter((table) => String(table.areaId) === String(selectedArea))
    .sort((a, b) =>
      String(a.code || "").localeCompare(String(b.code || ""), "vi", {
        numeric: true,
      }),
    );

  const isAutoArrange = bookingCartItems.length > 0;

  const selectedTableInfo = adminTables.find(
    (table) =>
      String(table.code) === String(selectedTable) &&
      String(table.areaId) === String(selectedArea),
  );

  const selectedTableOverCapacity =
    !isAutoArrange &&
    selectedTableInfo &&
    Number(form.guests || 0) > 0 &&
    Number(form.guests || 0) > Number(selectedTableInfo.capacity || 0);

  const isActiveBooking = (booking) => {
    return (
      booking.status === "pending" ||
      booking.status === "confirmed" ||
      booking.status === "serving" ||
      booking.status === "Chờ xác nhận" ||
      booking.status === "Đã xác nhận" ||
      booking.status === "Đang phục vụ"
    );
  };

  const isTableReservedAtSelectedDate = (tableCode) => {
    if (!form.date) return false;
    return bookings.some((booking) => {
      return (
        isActiveBooking(booking) &&
        String(booking.selectedTable) === String(tableCode) &&
        booking.date === form.date
      );
    });
  };

  const getTableBookingAtSelectedDate = (tableCode) => {
    if (!form.date) return null;
    return bookings.find((booking) => {
      return (
        isActiveBooking(booking) &&
        String(booking.selectedTable) === String(tableCode) &&
        booking.date === form.date
      );
    });
  };

  const getGuestCount = () => Number(form.guests || 0);

  const isUnavailableTable = (table) => {
    return (
      isTableReservedAtSelectedDate(table.code) ||
      table.status === "serving" ||
      table.status === "maintenance" ||
      table.status === "disabled"
    );
  };

  const findBestAvailableTable = (areaId = selectedArea) => {
    const guestCount = getGuestCount();

    return (
      adminTables
        .filter(
          (table) =>
            String(table.areaId) === String(areaId) &&
            !isUnavailableTable(table) &&
            (guestCount <= 0 || Number(table.capacity || 0) >= guestCount),
        )
        .sort((a, b) => {
          const capacityDiff =
            Number(a.capacity || 0) - Number(b.capacity || 0);
          if (capacityDiff !== 0) return capacityDiff;
          return String(a.code || "").localeCompare(
            String(b.code || ""),
            "vi",
            { numeric: true },
          );
        })[0] || null
    );
  };

  const handleSelectTable = (table) => {
    if (isAutoArrange) return;
    if (isUnavailableTable(table)) return;

    const guestCount = getGuestCount();
    const tableCapacity = Number(table.capacity || 0);

    if (guestCount > 0 && tableCapacity < guestCount) {
      const suggestedTable = findBestAvailableTable(selectedArea);
      if (suggestedTable) {
        showAdminToast({
          title: "Sức chứa không phù hợp",
          message: `Bàn ${table.code} chỉ chứa tối đa ${tableCapacity} người. Gợi ý: Bạn có thể chọn bàn ${suggestedTable.code} (${suggestedTable.capacity} chỗ) phù hợp cho ${guestCount} khách.`,
          type: "warning",
        });
      } else {
        showAdminToast({
          title: "Sức chứa không phù hợp",
          message: `Bàn ${table.code} chỉ chứa tối đa ${tableCapacity} người, nhưng bạn đang đặt ${guestCount} người. Vui lòng chọn bàn khác hoặc khu vực khác.`,
          type: "warning",
        });
      }
      return;
    }

    setSelectedTable(table.code);
    if (errors.table) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.table;
        return next;
      });
    }
  };

  const handleSelectArea = (areaId) => {
    const idStr = String(areaId);
    setSelectedArea(idStr);
    if (errors.area) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.area;
        return next;
      });
    }
    const bestTable = findBestAvailableTable(idStr);
    const tableCode = bestTable?.code || "";
    setSelectedTable(tableCode);
    if (tableCode && errors.table) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.table;
        return next;
      });
    }
  };

  useEffect(() => {
    if (!form.date || !selectedArea) return;

    // Nếu người dùng đã chọn một bàn và bàn đó vẫn khả dụng ở ngày mới, giữ nguyên lựa chọn
    if (selectedTable) {
      const currentTableObj = adminTables.find(
        (t) => String(t.areaId) === String(selectedArea) && String(t.code) === String(selectedTable)
      );
      const guestCount = getGuestCount();
      const isCurrentValid =
        currentTableObj &&
        !isUnavailableTable(currentTableObj) &&
        (guestCount <= 0 || Number(currentTableObj.capacity || 0) >= guestCount);

      if (isCurrentValid) {
        return;
      }
    }

    const bestTable = findBestAvailableTable(selectedArea);
    setSelectedTable(bestTable?.code || "");
  }, [form.date, form.guests, selectedArea, bookings, adminTables]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let val = value;
    if (name === "phone") {
      // Cho phép dấu + ở đầu, các ký tự sau phải là số
      val = value.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
    }
    setForm((prev) => ({
      ...prev,
      [name]: val,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const now = new Date();

    // 1. Họ và tên
    const nameRegex = /^[a-zA-ZÀ-ỹ\s]{2,100}$/;
    if (!form.name || !form.name.trim()) {
      newErrors.name = "Vui lòng nhập họ và tên";
    } else if (!nameRegex.test(form.name.trim())) {
      newErrors.name = "Họ và tên không hợp lệ (chỉ chứa chữ cái, từ 2 đến 100 ký tự)";
    }

    // 2. Số điện thoại: Chuẩn hóa +84 thành 0 nếu có và kiểm tra regex
    const rawPhone = (form.phone || "").trim();
    if (!rawPhone) {
      newErrors.phone = "Vui lòng nhập số điện thoại";
    } else {
      const normalizedPhone = rawPhone.startsWith("+84") ? "0" + rawPhone.slice(3) : rawPhone;
      if (!phoneRegex.test(rawPhone) && !phoneRegex.test(normalizedPhone)) {
        newErrors.phone =
          "Số điện thoại không đúng định dạng Việt Nam (10 số, bắt đầu bằng 03, 05, 07, 08, 09)";
      }
    }

    // 3. Email (nếu người dùng có nhập thì phải hợp lệ)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.email && form.email.trim() && !emailRegex.test(form.email.trim())) {
      newErrors.email = "Email không đúng định dạng (Ví dụ: name@gmail.com)";
    }

    // 4. Ngày dùng bữa
    if (!form.date) {
      newErrors.date = "Vui lòng chọn ngày dùng bữa";
    }

    // 5. Giờ đến
    if (!form.time) {
      newErrors.time = "Vui lòng chọn giờ dùng bữa";
    }

    // 6. Số lượng khách
    const guestNum = Number(form.guests);
    if (!form.guests || isNaN(guestNum) || guestNum <= 0) {
      newErrors.guests = "Vui lòng nhập số lượng khách";
    } else if (!Number.isInteger(guestNum)) {
      newErrors.guests = "Số lượng khách phải là số nguyên";
    } else if (guestNum > maxTableCapacity) {
      newErrors.guests = `Bàn đơn tối đa ${maxTableCapacity} người. Đặt tiệc đông người (> ${maxTableCapacity} khách), vui lòng gọi hotline 038 713 6878 để được sắp xếp chu đáo.`;
    }

    // Kiểm tra tính hợp lệ của Ngày & Giờ kết hợp
    if (form.date && form.time) {
      const selectedDateTime = new Date(`${form.date}T${form.time}`);
      const selectedDateOnly = new Date(`${form.date}T00:00`);
      const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const [hour, minute] = form.time.split(":").map(Number);
      const selectedMinutes = hour * 60 + minute;
      const openMinutes = 8 * 60; // 08:00
      const closeMinutes = 22 * 60; // 22:00

      if (selectedDateOnly < todayOnly) {
        newErrors.date = "Ngày đặt bàn không được nhỏ hơn hôm nay";
      } else if (selectedDateTime <= now) {
        newErrors.time = "Giờ đặt bàn phải lớn hơn thời gian hiện tại";
      } else if (selectedMinutes < openMinutes || selectedMinutes > closeMinutes) {
        newErrors.time = "Nhà hàng chỉ nhận đặt bàn từ 08:00 đến 22:00";
      }
    }

    // 7. Chọn không gian hẹn (khu vực)
    if (!selectedArea) {
      newErrors.area = "Vui lòng chọn khu vực bạn muốn ngồi";
    }

    // 8. Chọn bàn (nếu không phải tự động xếp bàn)
    if (!isAutoArrange && !selectedTable) {
      newErrors.table = "Vui lòng chọn bàn mong muốn trên sơ đồ";
    }

    setErrors(newErrors);

    // Thứ tự ưu tiên điều hướng từ trên xuống dưới
    const fieldOrder = [
      "name",
      "phone",
      "email",
      "date",
      "time",
      "guests",
      "area",
      "table",
    ];

    const firstErrorField = fieldOrder.find((field) => !!newErrors[field]);

    if (firstErrorField) {
      setTimeout(() => {
        if (firstErrorField === "table") {
          const tableSection = document.getElementById("table-map-section");
          tableSection?.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (firstErrorField === "area") {
          const areaSection = document.getElementById("area-selection-section");
          areaSection?.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          const errorInput = document.querySelector(`[name="${firstErrorField}"]`);
          if (errorInput) {
            errorInput.scrollIntoView({ behavior: "smooth", block: "center" });
            errorInput.focus?.({ preventScroll: true });
          }
        }
      }, 50);

      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    // 1. Kiểm tra tính hợp lệ của toàn bộ form trước để người dùng thấy lỗi ngay
    if (!validateForm()) return;

    // 2. Kiểm tra trạng thái đăng nhập
    if (!checkLogin()) {
      clearAuthSession();
      setIsLoggedIn(false);
      setShowLoginModal(true);
      return;
    }

    if (!isAutoArrange) {
      const guestCount = Number(form.guests || 0);

      if (!selectedTable) {
        showAdminToast({
          title: "Chưa chọn bàn",
          message: "Vui lòng chọn bàn trống để đặt.",
          type: "warning",
        });
        return;
      }

      const selectedTableData = adminTables.find(
        (table) =>
          String(table.code) === String(selectedTable) &&
          String(table.areaId) === String(selectedArea),
      );

      if (!selectedTableData) {
        showAdminToast({
          title: "Bàn không hợp lệ",
          message: "Bàn bạn chọn không hợp lệ. Vui lòng chọn lại bàn.",
          type: "error",
        });
        return;
      }

      if (guestCount > Number(selectedTableData.capacity || 0)) {
        const suggestedTable = findBestAvailableTable(selectedArea);
        if (suggestedTable) {
          showAdminToast({
            title: "Sức chứa không phù hợp",
            message: `Bàn ${selectedTableData.code} chỉ chứa tối đa ${selectedTableData.capacity} người. Vui lòng chọn bàn ${suggestedTable.code} (${suggestedTable.capacity} người) hoặc bàn khác.`,
            type: "warning",
          });
        } else {
          showAdminToast({
            title: "Sức chứa không phù hợp",
            message: `Hiện khu vực ${currentArea?.title || ""} không có bàn phù hợp cho ${guestCount} người. Vui lòng chọn khu vực khác hoặc liên hệ nhà hàng.`,
            type: "warning",
          });
        }
        return;
      }
    }

    const cleanPhone = form.phone.trim().startsWith("+84")
      ? "0" + form.phone.trim().slice(3)
      : form.phone.trim();

    const newBooking = {
      id: new Date().getTime(),
      source: "booking_page",
      type: isAutoArrange ? "table_with_food" : "table_only",

      customerName: form.name.trim(),
      phone: cleanPhone,
      email: form.email.trim(),

      selectedArea: isAutoArrange ? "" : selectedArea,
      selectedTable: isAutoArrange ? "" : selectedTable,
      selectedAreaTitle: isAutoArrange
        ? "Nhà hàng sắp xếp"
        : currentArea?.title || "Chưa có khu vực",

      date: form.date,
      time: form.time,
      guests: Number(form.guests),
      note: form.note,

      selectedDish: selectedDish
        ? {
          id: selectedDish.id,
          name: selectedDish.name,
          price: selectedDish.price,
          image: selectedDish.image,
        }
        : null,

      cartItems: bookingCartItems,

      subtotal,
      total: subtotal,
      totalQty: totalBookingQty,

      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const finalBooking = {
      ...newBooking,
      depositAmount: requiresDeposit ? 200000 : 0
    };

    try {
      const savedBooking = await bookingService.createBooking(finalBooking);
      setBookings((prev) => [savedBooking, ...prev]);

      if (requiresDeposit) {
        localStorage.setItem("currentBooking", JSON.stringify(savedBooking));
        navigate("/payment-qr");
      } else {
        isSubmittedRef.current = true;
        localStorage.removeItem("bookingForm");
        localStorage.removeItem("bookingSelectedArea");
        localStorage.removeItem("bookingSelectedTable");
        navigate("/booking-success");
      }
    } catch (error) {
      console.error(error);

      const isAuthError =
        error.status === 401 ||
        error.message?.includes("Phiên đăng nhập") ||
        error.message?.includes("hết hạn") ||
        error.message?.includes("chưa đăng nhập");

      if (isAuthError) {
        clearAuthSession();
        setIsLoggedIn(false);
        showAdminToast({
          title: "Phiên đăng nhập hết hạn",
          message:
            "Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục đặt bàn.",
          type: "warning",
        });
        setShowLoginModal(true);
        return;
      }

      showAdminToast({
        title: "Lỗi tạo đặt bàn",
        message: error.message || "Không thể tạo đặt bàn. Vui lòng thử lại.",
        type: "error",
      });
    }
  };

  const isVipArea = String(currentArea?.title || "").toLowerCase().includes("vip");
  const isLargeGroup = Number(form.guests || 0) >= 15;
  const requiresDeposit = isVipArea || isLargeGroup;

  const getFinalAreaImage = (area) => {
    if (!area || !area.image) {
      return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'%3E%3Crect width='400' height='250' fill='%23f1f5f9'/%3E%3Cpath d='M180 100h40v50h-40z M170 150h60v10h-60z' fill='%2394a3b8'/%3E%3Ctext x='50%25' y='180' dominant-baseline='middle' text-anchor='middle' fill='%2364748b' font-family='sans-serif' font-size='14'%3EKhông gian nhà hàng%3C/text%3E%3C/svg%3E";
    }
    const img = area.image;
    if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("data:")) {
      return img;
    }
    if (img.startsWith("/uploads/")) {
      return `${BACKEND_URL}${img}`;
    }
    return img;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SEO
        title="Đặt Bàn Trực Tuyến | Nhà Hàng Dê Hương Sơn - Thanh Trì Hà Nội"
        description="Đặt bàn tiệc gia đình, liên hoan, phòng VIP tại Nhà Hàng Dê Hương Sơn - Đường Vũ Lăng, Thanh Trì, Hà Nội. Giữ chỗ nhanh chóng, phục vụ tận tâm."
        canonical="/booking"
        schema={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Trang chủ",
              item: "https://dehuongson.vercel.app/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Đặt bàn",
              item: "https://dehuongson.vercel.app/booking",
            },
          ],
        }}
      />
      <main className="max-w-7xl mx-auto px-3.5 sm:px-5 py-6 md:py-8 pb-24 lg:pb-12">
        {/* Breadcrumb & Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#145c30] tracking-tight">
            Đặt bàn tại Dê Hương Sơn
          </h1>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mt-1.5 font-medium">
            <Link to="/home" className="hover:text-[#145c30] transition">Trang chủ</Link>
            <span>›</span>
            <span className="text-[#145c30] font-bold">Đặt bàn trực tuyến</span>
          </div>
        </div>

        {/* Selected Dishes Banner if any */}
        {bookingCartItems.length > 0 && (
          <div className="mb-6 bg-emerald-50/80 border border-emerald-200 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-base sm:text-lg text-[#145c30]">
                Món ăn đã chọn sẵn ({bookingCartItems.length} món)
              </h3>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {bookingCartItems.map((item) => (
                <div
                  key={item.id}
                  className="w-[140px] shrink-0 bg-white rounded-2xl p-2.5 border border-emerald-100 shadow-sm"
                >
                  <img
                    src={getImageUrl(item.image) || "/images/placeholder.jpg"}
                    alt={item.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/placeholder.jpg";
                    }}
                    className="w-full aspect-square object-cover rounded-xl"
                  />
                  <p className="font-bold text-slate-900 mt-2 text-xs line-clamp-2 h-8 leading-snug">
                    {item.name}
                  </p>
                  <div className="pt-2 border-t border-slate-100 mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">SL: {item.qty}</span>
                    <span className="font-extrabold text-amber-700 text-xs">
                      {item.price.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-emerald-200/80 mt-3 pt-3 flex items-center justify-between text-sm">
              <div>
                <span className="text-slate-600 font-medium">Tạm tính thực đơn:</span>
                <span className="ml-2 font-bold text-emerald-700">Tổng SL: {totalBookingQty}</span>
              </div>
              <span className="font-extrabold text-lg text-emerald-800">
                {subtotal.toLocaleString("vi-VN")}đ
              </span>
            </div>
          </div>
        )}

        {/* 2-Column Booking Layout */}
        <div className="grid lg:grid-cols-[1fr_410px] xl:grid-cols-[1fr_440px] gap-6 items-start">
          {/* LEFT: STEP CARDS */}
          <div className="space-y-6">
            {/* Step 1: Customer Info */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                  1
                </span>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  THÔNG TIN LIÊN HỆ
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <FormInput
                  label="Họ và tên khách hàng"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  icon={<User className="w-4 h-4" />}
                  error={errors.name}
                  maxLength={100}
                />
                <FormInput
                  label="Số điện thoại"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Ví dụ: 0901234567"
                  icon={<Phone className="w-4 h-4" />}
                  error={errors.phone}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <FormInput
                  label="Email (nhận xác nhận điện tử)"
                  name="email"
                  value={form.email || ""}
                  onChange={handleChange}
                  placeholder="Ví dụ: nguyenvana@gmail.com"
                  icon={<Mail className="w-4 h-4" />}
                  error={errors.email}
                />
                <label className="block text-left w-full">
                  <span className="block text-xs font-bold text-slate-700 mb-1.5 select-none">
                    Ghi chú đặc biệt
                  </span>
                  <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/15 transition">
                    <textarea
                      name="note"
                      value={form.note}
                      onChange={handleChange}
                      maxLength={200}
                      placeholder="Ghi chú thêm (VD: Chuẩn bị ghế trẻ em, trang trí sinh nhật...)"
                      className="w-full h-11 outline-none focus:outline-none focus:ring-0 border-none resize-none text-xs font-medium text-slate-800 bg-transparent placeholder:text-slate-400"
                    />
                    <p className="text-right text-[10px] text-slate-400 font-medium">{form.note.length}/200</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Step 2: Time & Date */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                  2
                </span>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  THỜI GIAN & SỐ LƯỢNG KHÁCH
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormInput
                  label="Ngày dùng bữa"
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  icon={<CalendarDays className="w-4 h-4" />}
                  error={errors.date}
                />
                <FormInput
                  label="Giờ đến"
                  name="time"
                  type="time"
                  value={form.time}
                  onChange={handleChange}
                  icon={<Clock className="w-4 h-4" />}
                  error={errors.time}
                  helperText="Phục vụ: 08:00 - 22:00"
                />
                <FormInput
                  label="Số lượng khách"
                  name="guests"
                  type="number"
                  value={form.guests}
                  onChange={handleChange}
                  placeholder="Ví dụ: 4"
                  icon={<Users className="w-4 h-4" />}
                  error={errors.guests}
                  min="1"
                  max={maxTableCapacity}
                  step="1"
                  helperText={errors.guests ? undefined : `Tối đa ${maxTableCapacity} khách/bàn (tiệc lớn vui lòng gọi hotline)`}
                />
              </div>
            </div>

            {/* Step 3: Area Selection */}
            <div
              id="area-selection-section"
              className={`bg-white rounded-3xl p-5 md:p-6 shadow-sm space-y-4 transition-all duration-200 ${
                errors.area
                  ? "border-2 border-rose-500 ring-4 ring-rose-500/10"
                  : "border border-slate-200/80"
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-xl text-white flex items-center justify-center text-xs font-black shadow-xs ${
                      errors.area ? "bg-rose-600" : "bg-emerald-600"
                    }`}
                  >
                    3
                  </span>
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                    CHỌN KHÔNG GIAN HẸN
                  </h2>
                </div>
                {errors.area && (
                  <p className="text-rose-600 text-xs font-bold flex items-center gap-1">
                    <span>⚠</span> {errors.area}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {areas.map((area) => {
                  const isSelected = String(selectedArea) === String(area.id);
                  const isVip = String(area.title).toLowerCase().includes("vip");

                  return (
                    <div
                      key={area.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectArea(area.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleSelectArea(area.id);
                        }
                      }}
                      className={`group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                        isSelected
                          ? "border-emerald-600 shadow-sm"
                          : errors.area
                            ? "border-rose-300 hover:border-rose-400 bg-white"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="h-28 overflow-hidden relative bg-slate-100">
                        <img
                          src={getFinalAreaImage(area)}
                          alt={area.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                        {isVip && (
                          <span className="absolute top-2 right-2 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
                            Cọc trước
                          </span>
                        )}
                      </div>

                      <div className="p-3 bg-white">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            {area.title}
                          </h4>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center shrink-0">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {area.text || "Không gian thoáng mát"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: TABLE SELECTOR MAP & SUBMISSION */}
          <aside
            id="table-map-section"
            className={`bg-white rounded-3xl p-5 md:p-6 shadow-sm space-y-5 lg:sticky lg:top-24 transition-all duration-200 ${
              errors.table
                ? "border-2 border-rose-500 ring-4 ring-rose-500/10"
                : "border border-slate-200/80"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                SƠ ĐỒ CHỌN BÀN
              </h2>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                {currentArea?.title || "Chưa chọn"}
              </span>
            </div>

            {errors.table && (
              <p className="text-rose-600 text-xs font-bold flex items-center gap-1.5 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                <span>⚠</span> {errors.table}
              </p>
            )}

            {isAutoArrange && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-900 font-semibold text-xs leading-relaxed">
                Bạn đang đặt kèm thực đơn. Nhà hàng sẽ tự động sắp xếp bàn phù hợp sau khi xác nhận.
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-600"></span>
                <span>Trống</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-300"></span>
                <span>Giữ chỗ</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-500"></span>
                <span>Đã đặt</span>
              </div>
            </div>

            {/* Table Grid */}
            <div
              className={`grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[220px] overflow-y-auto p-1.5 rounded-xl custom-scrollbar ${
                errors.table
                  ? "border-2 border-dashed border-rose-400 bg-rose-50/20"
                  : "pr-1"
              }`}
            >
              {currentTables.map((table) => {
                const tableBooking = getTableBookingAtSelectedDate(table.code);
                const holding = tableBooking?.status === "pending" || tableBooking?.status === "Chờ xác nhận";
                const booked = tableBooking?.status === "confirmed" || tableBooking?.status === "Đã xác nhận";
                const disabled = !!tableBooking || table.status === "serving" || table.status === "maintenance" || table.status === "disabled";
                const guestCount = getGuestCount();
                const insufficientCapacity = guestCount > 0 && Number(table.capacity || 0) < guestCount;
                const active = String(table.code) === String(selectedTable) && !disabled && !isAutoArrange;

                return (
                  <button
                    type="button"
                    key={table.id}
                    disabled={disabled || isAutoArrange}
                    onClick={() => handleSelectTable(table)}
                    className={`relative h-12 rounded-xl border-2 font-bold transition-all text-xs flex flex-col items-center justify-center ${active
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-extrabold"
                        : holding
                          ? "border-amber-300 bg-amber-50 text-amber-800 cursor-not-allowed"
                          : booked
                            ? "border-rose-200 bg-rose-50 text-rose-600 cursor-not-allowed"
                            : disabled || isAutoArrange
                              ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                              : insufficientCapacity
                                ? "border-amber-300 bg-amber-50/50 text-amber-800 hover:border-amber-500"
                                : "border-slate-200 bg-white text-slate-800 hover:border-emerald-500"
                      }`}
                  >
                    {active && !isAutoArrange && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-600 text-white text-[8px] flex items-center justify-center">✓</span>
                    )}
                    <span>{table.code}</span>
                    <span className="text-[9px] opacity-75 font-normal">{table.capacity} chỗ</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Table Summary Pill */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <h4 className="font-bold text-slate-900">
                  {isAutoArrange ? "Nhà hàng tự xếp bàn" : `Bàn đã chọn: ${selectedTable || "Chưa chọn"}`}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Sức chứa: {selectedTableInfo ? `${selectedTableInfo.capacity} khách` : "Chưa rõ"}
                  {form.guests ? ` • Đang đặt: ${form.guests} người` : ""}
                </p>
              </div>
              {selectedTableOverCapacity && (
                <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                  ⚠ Thiếu chỗ
                </span>
              )}
            </div>

            {/* Deposit Notice if required */}
            {requiresDeposit && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs">
                <h4 className="font-bold text-amber-950 flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wide">
                  <span>⚠️</span> Chính sách đặt cọc giữ bàn
                </h4>
                <p className="text-amber-900 leading-relaxed font-medium">
                  Yêu cầu đặt cọc trước <strong className="text-emerald-700">200.000đ</strong> đối với <strong>{isVipArea ? "phòng VIP" : "tiệc lớn (≥ 15 người)"}</strong>. Số tiền cọc sẽ được tự động khấu trừ vào hóa đơn khi dùng bữa.
                </p>
              </div>
            )}

            {/* Service Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
              <h4 className="font-extrabold text-slate-900 border-b border-slate-200 pb-2 uppercase tracking-wide">
                Tóm tắt đặt bàn
              </h4>
              <div className="grid grid-cols-2 gap-y-1.5 text-slate-600">
                <span>Khách hẹn:</span>
                <span className="font-bold text-slate-900 text-right truncate">{form.name || "Chưa nhập"}</span>

                <span>Thời gian:</span>
                <span className="font-bold text-slate-900 text-right">
                  {form.date
                    ? `${form.date.split("-").reverse().join("/")} lúc ${form.time || "..."}`
                    : "Chưa chọn"}
                </span>

                <span>Số lượng khách:</span>
                <span className="font-bold text-slate-900 text-right">{form.guests || 0} người</span>

                <span>Vị trí:</span>
                <span className="font-bold text-emerald-700 text-right truncate">
                  {isAutoArrange ? "Tự động sắp xếp" : `${currentArea?.title || "Khu vực"} • Bàn ${selectedTable || "..."}`}
                </span>

                {requiresDeposit && (
                  <>
                    <span className="text-amber-800 font-bold">Tiền cọc giữ chỗ:</span>
                    <span className="font-black text-right text-amber-700">200.000đ</span>
                  </>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              ref={setSubmitButtonEl}
              type="button"
              onClick={handleSubmit}
              className="w-full h-13 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md shadow-emerald-600/20 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 text-sm tracking-wide cursor-pointer"
            >
              <CalendarDays className="w-5 h-5" />
              {requiresDeposit ? "ĐẶT CỌC & XÁC NHẬN" : "XÁC NHẬN ĐẶT BÀN"}
            </button>
          </aside>
        </div>

        {/* Value Propositions Footer */}
        <section className="mt-8 bg-white border border-slate-200/80 rounded-2xl p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ServiceItem
            icon={<img src={goatIcon} alt="" className="w-6 h-6 object-contain" />}
            title="Nguyên liệu tươi ngon"
            text="Dê núi Hương Sơn tuyển chọn mỗi ngày"
          />
          <ServiceItem
            icon={<ChefHat className="w-5 h-5 text-amber-600" />}
            title="Phục vụ chuyên nghiệp"
            text="Đội ngũ đầu bếp & nhân viên tận tâm"
          />
          <ServiceItem
            icon={<ShieldCheck className="w-5 h-5 text-emerald-700" />}
            title="Vệ sinh an toàn thực phẩm"
            text="100% tươi sạch, không chất bảo quản"
          />
          <ServiceItem
            icon={<Headset className="w-5 h-5 text-blue-600" />}
            title="Hỗ trợ hotline 24/7"
            text="038 713 6878 / 076 877 4619"
          />
        </section>
      </main>

      {/* Floating Bottom Action Bar: Cố định ở dưới cùng khi nút chính bị cuộn khuất */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-8px_25px_rgba(0,0,0,0.12)] px-3.5 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-all duration-300 ease-in-out transform ${
          !isInlineButtonVisible
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Thông tin tóm tắt nhanh */}
          <div className="flex flex-col min-w-0 pr-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 truncate">
              <span className="truncate">
                {isAutoArrange
                  ? "Tự động xếp bàn"
                  : selectedTable
                    ? `Bàn ${selectedTable} • ${currentArea?.title || "Khu vực"}`
                    : "Chưa chọn bàn"}
              </span>
              {form.guests && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-700 font-extrabold whitespace-nowrap flex items-center gap-0.5">
                    <Users className="w-3 h-3 text-emerald-600 inline shrink-0" />
                    {form.guests} người
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 truncate">
              <span className="truncate">
                {form.date
                  ? `${form.date.split("-").reverse().join("/")}${form.time ? ` • ${form.time}` : ""}`
                  : "Chọn ngày & giờ"}
              </span>
              {requiresDeposit && (
                <>
                  <span className="text-emerald-300">•</span>
                  <span className="text-amber-700 font-extrabold whitespace-nowrap text-[11px]">
                    Cọc 200k
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Nút Xác nhận đặt bàn cố định */}
          <button
            type="button"
            onClick={handleSubmit}
            className="shrink-0 h-11 sm:h-12 py-2.5 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm tracking-wide cursor-pointer"
          >
            <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span className="truncate">
              {requiresDeposit ? "ĐẶT CỌC & XÁC NHẬN" : "XÁC NHẬN ĐẶT BÀN"}
            </span>
          </button>
        </div>
      </div>

      {showLoginModal && (
        <LoginRequiredModal
          onClose={() => setShowLoginModal(false)}
          onLogin={() => navigate("/login", { state: { from: "/booking" } })}
        />
      )}
    </div>
  );
}

function FormInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  icon,
  type = "text",
  error,
  helperText,
  ...props
}) {
  return (
    <label className="block text-left w-full">
      {label && (
        <span className="block text-xs font-bold text-slate-700 mb-1.5 select-none">
          {label}
        </span>
      )}
      <div
        className={`h-11 rounded-xl px-3 flex items-center gap-2 transition ${
          error
            ? "border-2 border-rose-500 bg-rose-50/40 ring-2 ring-rose-500/20"
            : "bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/15"
        }`}
      >
        <span className={`shrink-0 ${error ? "text-rose-500" : "text-slate-400"}`}>{icon}</span>
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full outline-none focus:outline-none focus:ring-0 border-none bg-transparent text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400"
          {...props}
        />
      </div>
      {error && (
        <p className="text-rose-600 text-[11px] mt-1 font-semibold flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
      {!error && helperText && (
        <p className="text-[11px] text-slate-400 mt-1 font-medium">{helperText}</p>
      )}
    </label>
  );
}

function ServiceItem({ icon, title, text }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
        {icon}
      </div>
      <div>
        <p className="font-bold text-slate-900 text-xs">{title}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{text}</p>
      </div>
    </div>
  );
}

export default BookingPage;
