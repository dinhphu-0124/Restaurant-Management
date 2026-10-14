import { checkLogin } from "../utils/auth";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BACKEND_URL, API_BASE_URL } from "../config/api";

import {
  ShoppingCart,
  Clock,
  CalendarDays,
  ShieldCheck,
  Truck,
  Store,
  Utensils,
  Trash2,
  Minus,
  Plus,
  ArrowLeft,
  ArrowRight,
  Lock,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  ServiceCard,
  DineInBookingForm,
  DeliveryForm,
  PickupForm,
} from "../components/checkout/CheckoutSubComponents";
import AppButton from "../components/ui/AppButton";
import AppBadge from "../components/ui/AppBadge";
import AppModal from "../components/ui/AppModal";
import { spaceService } from "../services/spaceService";
import { tableService } from "../services/tableService";
import { bookingService } from "../services/bookingService";
import { socket } from "../utils/socket";
import { showAdminToast } from "../components/admin/AdminToast";

// Helper normalization
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

function CheckoutPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [errors, setErrors] = useState({});
  const [showEmptyCartModal, setShowEmptyCartModal] = useState(false);

  const [lockedAccountModal, setLockedAccountModal] = useState({
    open: false,
    message: "",
  });

  const [toast, setToast] = useState({
    show: false,
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const API_URL = BACKEND_URL;

  const navigate = useNavigate();
  const currentUser =
    JSON.parse(localStorage.getItem("currentUser")) ||
    JSON.parse(sessionStorage.getItem("currentUser")) ||
    {};

  const getAuthToken = () => {
    return (
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
    );
  };

  const savedCheckoutForm =
    JSON.parse(localStorage.getItem("checkoutForm")) || {};

  const qrTableCode = localStorage.getItem("qrTableCode") || "";

  const [serviceType, setServiceType] = useState(
    qrTableCode ? "dinein" : (savedCheckoutForm.serviceType || "dinein"),
  );

  const [checkoutForm, setCheckoutForm] = useState({
    name: savedCheckoutForm.name || currentUser.name || currentUser.fullName || "",
    phone: savedCheckoutForm.phone || currentUser.phone || "",
    email: savedCheckoutForm.email || currentUser.email || "",
    address: savedCheckoutForm.address || "",
    date: savedCheckoutForm.date || "",
    time: savedCheckoutForm.time || "",
    guests: savedCheckoutForm.guests || "4",
    note: savedCheckoutForm.note || "",
  });

  // Booking & Table Data for Dine-in
  const [areas, setAreas] = useState([]);
  const [adminTables, setAdminTables] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [selectedArea, setSelectedArea] = useState(() => {
    return localStorage.getItem("bookingSelectedArea") || "";
  });
  const [selectedTable, setSelectedTable] = useState(() => {
    return qrTableCode || localStorage.getItem("bookingSelectedTable") || "";
  });

  const [isTableServing, setIsTableServing] = useState(false);
  const [pinCode, setPinCode] = useState("");

  const [deliveryTimeType, setDeliveryTimeType] = useState(
    savedCheckoutForm.deliveryTimeType || "now",
  );

  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cartItems");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    setIsLoggedIn(checkLogin());
  }, []);

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
    window.dispatchEvent(new Event("cartUpdated"));
  }, [cartItems]);

  useEffect(() => {
    if (qrTableCode) {
      const checkTableStatus = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/tables/check/${encodeURIComponent(qrTableCode)}`);
          const data = await res.json();
          if (data.success && data.table?.isServing) {
            setIsTableServing(true);
          }
        } catch (err) {
          console.error("Lỗi khi kiểm tra trạng thái bàn:", err);
        }
      };
      checkTableStatus();
    }
  }, [qrTableCode]);

  // Load Table & Space Data for Dine-in
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
                String(area.name || "").toLowerCase().trim(),
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
          if (qrTableCode) {
            const qrTable = mappedTables.find((t) => t.code === qrTableCode);
            if (qrTable) return qrTable.areaId;
          }
          const existed = mappedAreas.some(
            (area) => String(area.id) === String(prev),
          );
          return existed ? prev : firstArea.id;
        });

        setSelectedTable((prevTable) => {
          if (qrTableCode) return qrTableCode;
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
        console.error("Lỗi nạp dữ liệu bàn:", error);
        setAreas([]);
        setAdminTables([]);
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
  }, [qrTableCode]);

  // Load Booking Availability when date changes
  useEffect(() => {
    const loadBookingAvailability = async () => {
      if (!checkoutForm.date) {
        setBookings([]);
        return;
      }

      try {
        const bookedTables = await bookingService.getBookingAvailability(
          checkoutForm.date,
        );
        setBookings(Array.isArray(bookedTables) ? bookedTables : []);
      } catch (error) {
        console.error("Lỗi kiểm tra lịch đặt:", error);
        setBookings([]);
      }
    };

    loadBookingAvailability();
    window.addEventListener("bookingsUpdated", loadBookingAvailability);

    return () => {
      window.removeEventListener("bookingsUpdated", loadBookingAvailability);
    };
  }, [checkoutForm.date]);

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

  const selectedTableInfo = adminTables.find(
    (table) =>
      String(table.code) === String(selectedTable) &&
      String(table.areaId) === String(selectedArea),
  );

  const selectedTableOverCapacity =
    selectedTableInfo &&
    Number(checkoutForm.guests || 0) > 0 &&
    Number(checkoutForm.guests || 0) > Number(selectedTableInfo.capacity || 0);

  const isVipArea = String(currentArea?.title || "").toLowerCase().includes("vip");
  const isLargeGroup = Number(checkoutForm.guests || 0) >= 15;
  const requiresDeposit = serviceType === "dinein" && (isVipArea || isLargeGroup);

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

  const getTableBookingAtSelectedDate = (tableCode) => {
    if (!checkoutForm.date) return null;
    return bookings.find((booking) => {
      return (
        isActiveBooking(booking) &&
        String(booking.selectedTable) === String(tableCode) &&
        booking.date === checkoutForm.date
      );
    });
  };

  const findBestAvailableTable = (areaId = selectedArea) => {
    const guestCount = Number(checkoutForm.guests || 0);

    return (
      adminTables
        .filter((table) => {
          if (String(table.areaId) !== String(areaId)) return false;
          const isReserved = getTableBookingAtSelectedDate(table.code);
          if (isReserved) return false;
          if (table.status === "serving" || table.status === "maintenance" || table.status === "disabled") {
            return false;
          }
          return guestCount <= 0 || Number(table.capacity || 0) >= guestCount;
        })
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
    if (qrTableCode) return;
    const tableBooking = getTableBookingAtSelectedDate(table.code);
    if (tableBooking || table.status === "serving" || table.status === "maintenance" || table.status === "disabled") {
      return;
    }

    const guestCount = Number(checkoutForm.guests || 0);
    const tableCapacity = Number(table.capacity || 0);

    if (guestCount > 0 && tableCapacity < guestCount) {
      const suggestedTable = findBestAvailableTable(selectedArea);
      if (suggestedTable) {
        showAdminToast({
          title: "Sức chứa không phù hợp",
          message: `Bàn ${table.code} chỉ chứa tối đa ${tableCapacity} người. Gợi ý: Bạn có thể chọn bàn ${suggestedTable.code} (${suggestedTable.capacity} người) phù hợp cho ${guestCount} khách.`,
          type: "warning",
        });
      } else {
        showAdminToast({
          title: "Sức chứa không phù hợp",
          message: `Bàn ${table.code} chỉ chứa tối đa ${tableCapacity} người, nhưng bạn đang đặt ${guestCount} người. Hiện khu vực này chưa có bàn phù hợp, vui lòng chọn khu vực khác.`,
          type: "warning",
        });
      }
      return;
    }

    setSelectedTable(table.code);
  };

  const formatPrice = (price) => {
    return price.toLocaleString("vi-VN") + "đ";
  };

  const normalizeMoney = (value) => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }
    const number = Number(String(value || "").replace(/[^\d]/g, ""));
    return Number.isFinite(number) ? number : 0;
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + normalizeMoney(item.price) * Number(item.qty || 1),
    0,
  );

  const totalItems = cartItems.reduce(
    (sum, item) => sum + Number(item.qty || 1),
    0,
  );

  const checkoutSummary =
    JSON.parse(localStorage.getItem("checkoutSummary")) || null;
  const savedCoupon = checkoutSummary?.appliedCoupon || null;

  const SERVICE_TYPE_LABELS = {
    dinein: "Ăn tại quán",
    delivery: "Giao tận nơi",
    pickup: "Đến lấy tại quán",
  };

  const couponServiceTypes = Array.isArray(savedCoupon?.serviceTypes)
    ? savedCoupon.serviceTypes
    : [];

  const isCouponServiceValid =
    savedCoupon && couponServiceTypes.includes(serviceType);

  const isCouponMinOrderValid =
    savedCoupon && subtotal >= Number(savedCoupon.minOrder || 0);

  const autoDiscountRule = checkoutSummary?.autoDiscountRule || {
    title: "Hóa đơn trên 2.000.000đ",
    percent: 5,
    minOrder: 2000000,
    serviceTypes: ["dinein"],
  };

  const isAutoDiscountServiceValid =
    Array.isArray(autoDiscountRule.serviceTypes) &&
    autoDiscountRule.serviceTypes.includes(serviceType);

  const isAutoDiscountMinOrderValid =
    subtotal >= Number(autoDiscountRule.minOrder || 0);

  const canUseAutoDiscount =
    isAutoDiscountServiceValid && isAutoDiscountMinOrderValid;

  const autoDiscountTotal = canUseAutoDiscount
    ? (subtotal * Number(autoDiscountRule.percent || 0)) / 100
    : 0;

  const appliedCoupon =
    isCouponServiceValid && isCouponMinOrderValid ? savedCoupon : null;

  const couponDiscountTotal = appliedCoupon
    ? Number(checkoutSummary?.couponDiscountTotal || 0)
    : 0;

  const discountTotal = appliedCoupon
    ? couponDiscountTotal
    : canUseAutoDiscount
    ? autoDiscountTotal
    : 0;

  const shippingFee = serviceType === "delivery" ? 15000 : 0;
  const total = subtotal - discountTotal + shippingFee;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const finalValue = name === "phone" ? value.replace(/\D/g, "") : value;
    const updatedForm = { ...checkoutForm, [name]: finalValue };
    setCheckoutForm(updatedForm);
    localStorage.setItem(
      "checkoutForm",
      JSON.stringify({
        ...updatedForm,
        serviceType,
        deliveryTimeType,
      }),
    );
  };

  const handleChangeServiceType = (type) => {
    if (qrTableCode) {
      showAdminToast({
        title: "Thông báo",
        message: `Bạn đang gọi món trực tiếp tại Bàn ${qrTableCode}. Hình thức phục vụ bắt buộc là Ăn tại quán.`,
        type: "info",
      });
      return;
    }
    setErrors({});
    setServiceType(type);
    const newDeliveryTimeType = type === "delivery" ? deliveryTimeType : "now";
    setDeliveryTimeType(newDeliveryTimeType);

    localStorage.setItem(
      "checkoutForm",
      JSON.stringify({
        ...checkoutForm,
        serviceType: type,
        deliveryTimeType: newDeliveryTimeType,
      }),
    );
  };

  const removeCheckoutItem = (id) => {
    const removedItem = cartItems.find((item) => item.id === id);
    const newCartItems = cartItems.filter((item) => item.id !== id);
    setCartItems(newCartItems);

    setToast({
      show: true,
      message: `Đã xóa "${removedItem?.name}" khỏi đơn hàng`,
    });

    setTimeout(() => {
      setToast({ show: false, message: "" });
    }, 3000);
  };

  const updateCheckoutQty = (id, type, priceOptionId = null) => {
    const newCartItems = cartItems
      .map((item) => {
        if (
          item.id === id &&
          (item.priceOptionId || null) === (priceOptionId || null)
        ) {
          const newQty =
            type === "increase" ? item.qty + 1 : Math.max(0, item.qty - 1);
          return { ...item, qty: newQty };
        }
        return item;
      })
      .filter((item) => item.qty > 0);

    setCartItems(newCartItems);
    localStorage.setItem("cartItems", JSON.stringify(newCartItems));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const validateOrder = () => {
    const newErrors = {};
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    const now = new Date();

    if (!checkoutForm.name?.trim()) {
      newErrors.name = "Vui lòng nhập họ và tên";
    }

    if (!phoneRegex.test(checkoutForm.phone || "")) {
      newErrors.phone = "Số điện thoại không đúng định dạng Việt Nam (10 số, bắt đầu bằng 03, 05, 07, 08, 09)";
    }

    if (serviceType === "dinein") {
      if (!checkoutForm.date) newErrors.date = "Vui lòng chọn ngày dùng bữa";
      if (!checkoutForm.time) newErrors.time = "Vui lòng chọn giờ đến";
      if (!checkoutForm.guests || Number(checkoutForm.guests) <= 0) {
        newErrors.guests = "Số khách phải lớn hơn 0";
      }

      if (checkoutForm.date && checkoutForm.time) {
        const selectedDateTime = new Date(`${checkoutForm.date}T${checkoutForm.time}`);
        const selectedDateOnly = new Date(`${checkoutForm.date}T00:00`);
        const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const [hour, minute] = checkoutForm.time.split(":").map(Number);
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

      if (!selectedArea) {
        newErrors.area = "Vui lòng chọn không gian hẹn";
      }

      if (!selectedTable) {
        newErrors.table = "Vui lòng chọn bàn mong muốn";
      }
    }

    if (serviceType === "delivery") {
      if (!checkoutForm.address?.trim()) {
        newErrors.address = "Vui lòng nhập địa chỉ nhận hàng chi tiết";
      }

      if (deliveryTimeType === "now") {
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const openMinutes = 8 * 60;
        const closeMinutes = 22 * 60;

        if (currentMinutes < openMinutes || currentMinutes > closeMinutes) {
          newErrors.time = "Hiện tại ngoài giờ hoạt động. Nhà hàng chỉ giao từ 08:00 đến 22:00";
        }
      }

      if (deliveryTimeType === "schedule") {
        if (!checkoutForm.date) newErrors.date = "Vui lòng chọn ngày giao";
        if (!checkoutForm.time) newErrors.time = "Vui lòng chọn giờ giao";

        if (checkoutForm.date && checkoutForm.time) {
          const selectedDateTime = new Date(`${checkoutForm.date}T${checkoutForm.time}`);
          const selectedDateOnly = new Date(`${checkoutForm.date}T00:00`);
          const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const [hour, minute] = checkoutForm.time.split(":").map(Number);
          const selectedMinutes = hour * 60 + minute;

          if (selectedDateOnly < todayOnly) {
            newErrors.date = "Ngày giao hàng phải từ hôm nay trở đi";
          } else if (selectedDateTime <= now) {
            newErrors.time = "Giờ giao hàng phải lớn hơn giờ hiện tại";
          } else if (selectedMinutes < 8 * 60 || selectedMinutes > 22 * 60) {
            newErrors.time = "Khung giờ giao hàng chỉ từ 08:00 đến 22:00";
          }
        }
      }
    }

    if (serviceType === "pickup") {
      if (!checkoutForm.date) newErrors.date = "Vui lòng chọn ngày đến lấy";
      if (!checkoutForm.time) newErrors.time = "Vui lòng chọn giờ đến lấy";

      if (checkoutForm.date && checkoutForm.time) {
        const selectedDateTime = new Date(`${checkoutForm.date}T${checkoutForm.time}`);
        const selectedDateOnly = new Date(`${checkoutForm.date}T00:00`);
        const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const [hour, minute] = checkoutForm.time.split(":").map(Number);
        const selectedMinutes = hour * 60 + minute;

        if (selectedDateOnly < todayOnly) {
          newErrors.date = "Ngày đến lấy không được nhỏ hơn hôm nay";
        } else if (selectedDateTime <= now) {
          newErrors.time = "Giờ đến lấy phải lớn hơn giờ hiện tại";
        } else if (selectedMinutes < 8 * 60 || selectedMinutes > 22 * 60) {
          newErrors.time = "Nhà hàng chỉ phục vụ lấy món từ 08:00 đến 22:00";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLockedAccount = (message) => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("avatar");

    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("currentUser");
    sessionStorage.removeItem("avatar");

    window.dispatchEvent(new Event("authChanged"));
    window.dispatchEvent(new Event("loginStatusChanged"));
    window.dispatchEvent(new Event("avatarUpdated"));

    setLockedAccountModal({
      open: true,
      message: message || "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ nhà hàng.",
    });
  };

  const handleSubmitCheckout = async () => {
    if (isSubmitting) return;

    if (cartItems.length === 0) {
      setShowEmptyCartModal(true);
      return;
    }

    if (!checkLogin()) {
      navigate("/login");
      return;
    }

    if (!validateOrder()) return;

    setIsSubmitting(true);

    try {
      const orderId = "DH" + Date.now();
      const customerName = checkoutForm.name || "";
      const phone = checkoutForm.phone || "";
      const email = checkoutForm.email || "";
      const address = checkoutForm.address || "";
      const date = checkoutForm.date || "";
      const time = checkoutForm.time || "";
      const guests = checkoutForm.guests || "";
      const note = checkoutForm.note || "";

      const normalizedCartItems = cartItems.map((item) => ({
        ...item,
        id: item.id || item.code,
        code: item.code || item.id,
        priceOptionId: item.priceOptionId || null,
        priceOptionNote: item.priceOptionNote || "",
        price: normalizeMoney(item.price),
        qty: Number(item.qty || 1),
      }));

      // 1. DINE-IN BOOKING WITH FOOD ORDER FLOW
      if (serviceType === "dinein") {
        if (isTableServing && !pinCode.trim()) {
          showAdminToast({
            title: "Yêu cầu mã PIN",
            message: "Vui lòng nhập mã PIN của bàn để gọi thêm món.",
            type: "warning",
          });
          setIsSubmitting(false);
          return;
        }

        const token = getAuthToken();
        if (!token) {
          navigate("/login");
          return;
        }

        const bookingData = {
          id: new Date().getTime(),
          source: "checkout_page",
          type: "table_with_order",
          customerName: customerName || currentUser.name || currentUser.fullName || "",
          name: customerName || currentUser.name || currentUser.fullName || "",
          phone: phone || currentUser.phone || "",
          email: email || currentUser.email || "",
          date,
          time,
          guests: Number(guests || 1),
          selectedArea: selectedArea || "",
          selectedAreaTitle: currentArea?.title || "Chưa chọn khu vực",
          selectedTable: selectedTable || "",
          pinCode: pinCode.trim(),
          note,
          cartItems: normalizedCartItems,
          subtotal,
          discountTotal,
          total,
          totalQty: totalItems,
          status: "pending",
          createdAt: new Date().toISOString(),
          depositAmount: requiresDeposit ? 200000 : 0,
        };

        const res = await fetch(`${API_URL}/api/bookings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(bookingData),
        });

        const data = await res.json();

        if (
          data.code === "ACCOUNT_LOCKED" ||
          data.code === "ACCOUNT_INACTIVE"
        ) {
          handleLockedAccount(data.message);
          return;
        }

        if (!res.ok || !data.success) {
          showAdminToast({
            title: "Lỗi tạo đặt bàn",
            message: data.message || "Không thể tạo đặt bàn. Vui lòng thử lại.",
            type: "error",
          });
          return;
        }

        const savedBooking = {
          ...bookingData,
          ...data.booking,
        };

        localStorage.setItem("currentBooking", JSON.stringify(savedBooking));
        localStorage.removeItem("cartItems");
        localStorage.removeItem("checkoutSummary");
        localStorage.removeItem("appliedCoupon");
        localStorage.removeItem("checkoutForm");

        window.dispatchEvent(new Event("cartUpdated"));

        if (requiresDeposit) {
          navigate("/payment-qr");
        } else {
          navigate("/booking-success");
        }
        return;
      }

      // 2. DELIVERY OR PICKUP ORDER FLOW
      const token = getAuthToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const orderData = {
        id: orderId,
        customerName: customerName || currentUser.name || "",
        phone: phone || currentUser.phone || "",
        email: email || currentUser.email || "",
        address,
        serviceType,
        deliveryTimeType,
        date,
        time,
        note,
        cartItems: normalizedCartItems,
        subtotal,
        discountTotal,
        couponDiscountTotal,
        shippingFee,
        total,
        totalItems,
        appliedCoupon,
        paymentMethod: "bank",
        paymentStatus: "pending",
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();

      if (
        data.code === "ACCOUNT_LOCKED" ||
        data.code === "ACCOUNT_INACTIVE"
      ) {
        handleLockedAccount(data.message);
        return;
      }

      if (!res.ok || !data.success) {
        showAdminToast({
          title: "Lỗi tạo đơn hàng",
          message: data.message || "Không thể tạo đơn hàng. Vui lòng thử lại.",
          type: "error",
        });
        return;
      }

      const savedOrder = {
        ...orderData,
        ...data.order,
      };

      localStorage.setItem("currentOrder", JSON.stringify(savedOrder));
      navigate("/payment-qr");
    } catch (error) {
      console.error("Lỗi khi tạo đơn hàng:", error);
      showAdminToast({
        title: "Lỗi kết nối",
        message: "Không thể kết nối máy chủ. Vui lòng thử lại.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="max-w-7xl mx-auto px-5 py-6 md:py-8">
        {/* Header & Breadcrumbs */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-emerald-800 tracking-tight">
            Xác nhận & Thanh toán
          </h1>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mt-1.5 font-medium">
            <Link to="/home" className="hover:text-emerald-700 transition">
              Trang chủ
            </Link>
            <span>›</span>
            <Link to="/cart" className="hover:text-emerald-700 transition">
              Giỏ hàng
            </Link>
            <span>›</span>
            <span className="text-emerald-700 font-bold">Thanh toán</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_440px] gap-6 items-start">
          {/* LEFT: SERVICE FORM */}
          <section className="space-y-6">
            {qrTableCode && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 md:px-5 py-3.5 rounded-2xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                  <span className="font-semibold text-xs sm:text-sm">
                    Đang gọi món trực tiếp tại Bàn:{" "}
                    <span className="text-emerald-700 font-extrabold text-sm sm:text-base">
                      {qrTableCode}
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* 1. Choose Service Type */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm">
              <h2 className="font-extrabold text-slate-900 text-base uppercase tracking-wide mb-4">
                1. Chọn hình thức phục vụ
              </h2>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                <ServiceCard
                  active={serviceType === "dinein"}
                  icon={<Utensils className="w-full h-full" />}
                  title="Ăn tại quán"
                  subtitle="Dine In"
                  text="Đặt bàn & dùng bữa trực tiếp tại nhà hàng."
                  onClick={() => handleChangeServiceType("dinein")}
                />

                <ServiceCard
                  active={serviceType === "delivery"}
                  icon={<Truck className="w-full h-full" />}
                  title="Giao tận nơi"
                  subtitle="Delivery"
                  text="Giao món tận nhà nhanh chóng, nóng sốt."
                  onClick={() => handleChangeServiceType("delivery")}
                />

                <ServiceCard
                  active={serviceType === "pickup"}
                  icon={<Store className="w-full h-full" />}
                  title="Đến lấy mang về"
                  subtitle="Take Away"
                  text="Chuẩn bị sẵn, đến lấy không chờ đợi."
                  onClick={() => handleChangeServiceType("pickup")}
                />
              </div>
            </div>

            {/* 2. Corresponding Service Form */}
            {serviceType === "dinein" && (
              <DineInBookingForm
                form={checkoutForm}
                errors={errors}
                handleChange={handleChange}
                areas={areas}
                selectedArea={selectedArea}
                setSelectedArea={setSelectedArea}
                currentTables={currentTables}
                selectedTable={selectedTable}
                setSelectedTable={setSelectedTable}
                selectedTableInfo={selectedTableInfo}
                selectedTableOverCapacity={selectedTableOverCapacity}
                getTableBookingAtSelectedDate={getTableBookingAtSelectedDate}
                handleSelectTable={handleSelectTable}
                findBestAvailableTable={findBestAvailableTable}
                getFinalAreaImage={getFinalAreaImage}
                requiresDeposit={requiresDeposit}
                isVipArea={isVipArea}
                isTableServing={isTableServing}
                pinCode={pinCode}
                setPinCode={setPinCode}
                qrTableCode={qrTableCode}
              />
            )}

            {serviceType === "delivery" && (
              <DeliveryForm
                errors={errors}
                deliveryTimeType={deliveryTimeType}
                setDeliveryTimeType={setDeliveryTimeType}
                checkoutForm={checkoutForm}
                handleChange={handleChange}
              />
            )}

            {serviceType === "pickup" && (
              <PickupForm
                errors={errors}
                checkoutForm={checkoutForm}
                handleChange={handleChange}
              />
            )}
          </section>

          {/* RIGHT: ORDER SUMMARY SIDEBAR */}
          <aside className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm sticky top-24 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="font-extrabold text-slate-900 text-base uppercase tracking-wide">
                Đơn hàng ({totalItems} món)
              </h2>

              <AppBadge variant="neutral" size="sm" pill>
                {SERVICE_TYPE_LABELS[serviceType]}
              </AppBadge>
            </div>

            {/* Scrollable Items List */}
            <div className="max-h-[260px] overflow-y-auto pr-1 divide-y divide-slate-100 custom-scrollbar">
              {cartItems.map((item) => (
                <div
                  key={`${item.id}_${item.priceOptionId || 0}`}
                  className="py-3 flex gap-3 items-center"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-13 h-13 rounded-xl object-cover shrink-0 bg-slate-100 border border-slate-100"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {item.name}
                      </h3>
                      <span className="font-extrabold text-amber-700 text-xs shrink-0">
                        {formatPrice(item.price)}
                      </span>
                    </div>

                    {item.priceOptionNote && (
                      <p className="text-[11px] font-bold text-emerald-700 mt-0.5">
                        Quy cách: {item.priceOptionNote}
                      </p>
                    )}

                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="h-7 rounded-lg border border-slate-200 flex items-center justify-between px-1.5 bg-slate-50 w-22">
                        <button
                          type="button"
                          aria-label="Giảm"
                          onClick={() =>
                            updateCheckoutQty(
                              item.id,
                              "decrease",
                              item.priceOptionId,
                            )
                          }
                          className="w-5 h-5 text-slate-600 hover:text-slate-900 flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-xs text-slate-900">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          aria-label="Tăng"
                          onClick={() =>
                            updateCheckoutQty(
                              item.id,
                              "increase",
                              item.priceOptionId,
                            )
                          }
                          className="w-5 h-5 text-slate-600 hover:text-slate-900 flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        aria-label="Xóa"
                        onClick={() => removeCheckoutItem(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Dine-in Booking Summary Pill in Sidebar */}
            {serviceType === "dinein" && (
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3.5 text-xs space-y-1.5">
                <h4 className="font-extrabold text-emerald-900 uppercase text-[11px] tracking-wide border-b border-emerald-100 pb-1 flex items-center justify-between">
                  <span>Thông tin bàn ăn</span>
                  <span className="text-emerald-700 font-bold">{currentArea?.title || "Khu vực"}</span>
                </h4>
                <div className="grid grid-cols-2 gap-y-1 text-slate-600">
                  <span>Bàn đã chọn:</span>
                  <span className="font-bold text-slate-900 text-right">
                    {selectedTable ? `Bàn ${selectedTable}` : "Chưa chọn"}
                  </span>

                  <span>Thời gian đến:</span>
                  <span className="font-bold text-slate-900 text-right">
                    {checkoutForm.date
                      ? `${checkoutForm.date.split("-").reverse().join("/")} ${checkoutForm.time || ""}`
                      : "Chưa chọn"}
                  </span>

                  <span>Số lượng khách:</span>
                  <span className="font-bold text-slate-900 text-right">
                    {checkoutForm.guests || 0} người
                  </span>

                  {requiresDeposit && (
                    <>
                      <span className="text-amber-800 font-bold">Tiền cọc giữ bàn:</span>
                      <span className="font-black text-amber-700 text-right">200.000đ</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Calculations Breakdown */}
            <div className="border-t border-slate-200 pt-4 space-y-2 text-xs sm:text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Tạm tính món ăn:</span>
                <strong className="text-slate-900">{formatPrice(subtotal)}</strong>
              </div>

              {serviceType === "delivery" && (
                <div className="flex justify-between">
                  <span>Phí giao hàng:</span>
                  <strong className="text-slate-900">{formatPrice(shippingFee)}</strong>
                </div>
              )}

              <div>
                <div className="flex justify-between">
                  <span>Giảm giá:</span>
                  <strong className="text-emerald-700">
                    - {formatPrice(discountTotal)}
                  </strong>
                </div>

                <div className="mt-1 pl-2 border-l-2 border-slate-200 text-[11px] space-y-0.5">
                  {appliedCoupon ? (
                    <div className="flex justify-between text-emerald-700">
                      <span>Mã {appliedCoupon.code}</span>
                      <span>- {formatPrice(couponDiscountTotal)}</span>
                    </div>
                  ) : (
                    canUseAutoDiscount && (
                      <div className="flex justify-between text-emerald-700">
                        <span>{autoDiscountRule.title}</span>
                        <span>- {formatPrice(autoDiscountTotal)}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Grand Total */}
            <div className="border-t border-slate-200 pt-3.5 flex items-baseline justify-between">
              <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                Tổng cộng:
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight">
                {formatPrice(total)}
              </span>
            </div>

            <p className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              Đã bao gồm thuế VAT
            </p>

            {/* Submit Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitCheckout}
              className="w-full h-13 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm tracking-wide shadow-md shadow-emerald-600/20 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                "Đang xử lý..."
              ) : (
                <>
                  {serviceType === "dinein"
                    ? requiresDeposit
                      ? "ĐẶT CỌC & XÁC NHẬN"
                      : "XÁC NHẬN ĐẶT BÀN & MÓN"
                    : "HOÀN TẤT ĐẶT HÀNG"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </aside>
        </div>
      </main>

      {/* Locked Account Modal */}
      {lockedAccountModal.open && (
        <AppModal
          isOpen={lockedAccountModal.open}
          onClose={() => setLockedAccountModal({ open: false, message: "" })}
          title="Tài khoản bị khóa"
          size="sm"
        >
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <p className="text-slate-600 text-xs sm:text-sm">
              {lockedAccountModal.message}
            </p>
            <AppButton
              variant="primary"
              onClick={() => {
                setLockedAccountModal({ open: false, message: "" });
                navigate("/login");
              }}
              className="mt-4"
            >
              Đăng nhập lại
            </AppButton>
          </div>
        </AppModal>
      )}

      {/* Empty Cart Modal */}
      {showEmptyCartModal && (
        <AppModal
          isOpen={showEmptyCartModal}
          onClose={() => setShowEmptyCartModal(false)}
          title="Giỏ hàng trống"
          size="sm"
        >
          <p className="text-slate-600 text-xs sm:text-sm">
            Bạn chưa có món ăn nào trong giỏ hàng. Vui lòng chọn món trước khi đặt hàng.
          </p>
          <div className="flex justify-end gap-2 mt-5">
            <AppButton
              variant="primary"
              size="sm"
              onClick={() => {
                setShowEmptyCartModal(false);
                navigate("/menu");
              }}
            >
              Xem thực đơn
            </AppButton>
          </div>
        </AppModal>
      )}
    </div>
  );
}

export default CheckoutPage;
