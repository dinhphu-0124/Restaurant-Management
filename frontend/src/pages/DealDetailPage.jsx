import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Gift,
  CalendarDays,
  CheckCircle,
  ArrowLeft,
  Utensils,
  Copy,
} from "lucide-react";

function DealDetailPage() {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [adminDeals, setAdminDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    fetch("http://localhost:5001/api/deals")
      .then((res) => res.json())
      .then((data) => {
        setAdminDeals(data.deals || []);
      })
      .catch((error) => {
        console.error("Lỗi tải chi tiết ưu đãi:", error);
        setAdminDeals([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const formatDate = (value) => {
    if (!value) return "Chưa có";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("vi-VN");
  };

  const SERVICE_TYPE_LABELS = {
    dinein: "Ăn tại quán",
    delivery: "Giao tận nơi",
    pickup: "Đến lấy tại quán",
  };

  const getServiceTypeText = (serviceTypes = []) => {
    if (!Array.isArray(serviceTypes) || serviceTypes.length === 0) {
      return "Tất cả hình thức phục vụ";
    }

    return serviceTypes
      .map((type) => SERVICE_TYPE_LABELS[type])
      .filter(Boolean)
      .join(", ");
  };

  const getAdminConditions = (adminDeal) => {
    const serviceTypes = adminDeal.serviceTypes || [];
    const serviceConditionItems = adminDeal.serviceConditionItems || {};

    const minOrderCondition = adminDeal.condition
      ? [
          `Áp dụng cho hóa đơn từ ${Number(adminDeal.condition).toLocaleString(
            "vi-VN",
          )}đ`,
        ]
      : [];

    const serviceTypeCondition =
      serviceTypes.length > 0
        ? [`Áp dụng cho hình thức phục vụ: ${getServiceTypeText(serviceTypes)}`]
        : [];

    const conditionItems = Array.isArray(adminDeal.conditionItems)
      ? adminDeal.conditionItems
      : [];

    const serviceConditions = serviceTypes.flatMap(
      (type) => serviceConditionItems[type] || [],
    );

    return [
      ...minOrderCondition,
      ...serviceTypeCondition,
      ...conditionItems,
      ...serviceConditions,
    ].filter((item, index, array) => item && array.indexOf(item) === index);
  };

  const getDealAction = (adminDeal) => {
    const serviceTypes = adminDeal.serviceTypes || [];

    if (serviceTypes.includes("delivery") || serviceTypes.includes("pickup")) {
      return {
        route: "/menu",
        button: "Đặt món ngay",
      };
    }

    if (serviceTypes.includes("dinein")) {
      return {
        route: "/booking",
        button: "Đặt bàn ngay",
      };
    }

    return {
      route: "/menu",
      button: "Đặt món ngay",
    };
  };

  const adminDeal = adminDeals.find(
    (item) =>
      (item.status === "active" || item.status === "upcoming") &&
      (String(item.slug) === String(dealId) ||
        String(item.code) === String(dealId) ||
        String(item.id) === String(dealId)),
  );

  const deal = adminDeal
    ? {
        icon: <Gift />,
        image: adminDeal.detailImage || adminDeal.cardImage,
        label: adminDeal.subtitle || adminDeal.type || "Khuyến mãi",
        title: adminDeal.name,
        discount: adminDeal.discount,
        code: adminDeal.code,
        minOrder: adminDeal.condition
          ? `Áp dụng cho hóa đơn từ ${Number(
              adminDeal.condition,
            ).toLocaleString("vi-VN")}đ`
          : "Không có điều kiện số tiền",
        desc: adminDeal.desc || adminDeal.subtitle,
        time: `${formatDate(adminDeal.startDate)} - ${formatDate(
          adminDeal.endDate,
        )}`,
        serviceTypes: adminDeal.serviceTypes || [],
        serviceText: getServiceTypeText(adminDeal.serviceTypes),
        condition: getAdminConditions(adminDeal),
        route: getDealAction(adminDeal).route,
        button: getDealAction(adminDeal).button,
      }
    : null;

  const handleCopyCoupon = () => {
    if (!deal?.code) return;

    navigator.clipboard.writeText(deal.code);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbf7ec] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 text-center shadow-md">
          <h1 className="text-2xl font-black text-[#145c30]">
            Đang tải khuyến mãi...
          </h1>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-[#fbf7ec] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 text-center shadow-md">
          <h1 className="text-2xl font-black text-[#145c30]">
            Không tìm thấy khuyến mãi
          </h1>
          <Link
            to="/deals"
            className="inline-block mt-5 bg-green-900 text-white px-6 py-3 rounded-xl font-bold"
          >
            Quay lại khuyến mãi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf7ec] text-green-950 pt-[25px]">
      <main className="max-w-6xl mx-auto px-4 md:px-6 pb-12">
        <button
          onClick={() => navigate("/deals")}
          className="flex items-center gap-2 text-green-900 font-bold mb-5 hover:text-[#b88935]"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại khuyến mãi
        </button>

        <section
          className="relative overflow-hidden rounded-3xl shadow-xl bg-green-950 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: deal.image
              ? `url(${deal.image})`
              : "linear-gradient(to right, #022c22, #065f46)",
          }}
        >
          {/* Lớp mờ chỉ nằm nửa bên trái sau chữ */}
          {deal.image && (
            <div
              className="absolute inset-y-0 left-0 w-[68%] z-0"
              style={{
                background:
                  "linear-gradient(to right, rgba(20, 14, 5, 0.72) 0%, rgba(45, 30, 8, 0.55) 55%, rgba(45, 30, 8, 0.18) 82%, rgba(45, 30, 8, 0) 100%)",
              }}
            />
          )}

          <div className="relative z-10 p-6 md:p-10 text-white max-w-3xl">
            <div>
              <span className="inline-flex items-center gap-2 border border-[#d6a84f] text-[#f6d47a] px-4 py-2 rounded-lg text-xs font-black uppercase">
                <Gift className="w-4 h-4" />
                {deal.label}
              </span>

              <h1 className="text-4xl md:text-6xl font-black mt-7">
                {deal.title}
              </h1>

              <h2 className="text-5xl md:text-7xl font-black text-[#f6d47a] mt-4">
                {deal.discount}
              </h2>

              <p className="text-white/80 leading-relaxed mt-6 max-w-2xl">
                {deal.desc}
              </p>

              <div className="flex items-center gap-3 mt-6 text-white/80">
                <CalendarDays className="w-5 h-5 text-[#f6d47a]" />
                <span>{deal.time}</span>
              </div>
              {deal.serviceText && (
                <div className="flex items-center gap-3 mt-3 text-white/80">
                  <Utensils className="w-5 h-5 text-[#f6d47a]" />
                  <span>{deal.serviceText}</span>
                </div>
              )}

              {/* mã khuyến mãi */}
              {deal.code && (
                <div className="mt-6 max-w-md bg-white/10 border border-white/20 rounded-2xl p-4">
                  <p className="text-sm text-white/70 font-bold mb-2">
                    Mã khuyến mãi
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-white text-green-950 rounded-xl px-4 py-3 font-black tracking-widest text-lg">
                      {deal.code}
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyCoupon}
                      className="h-[52px] px-4 rounded-xl bg-[#f6c441] text-green-950 font-black hover:bg-[#d6a84f] transition flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      {copied ? "Đã copy" : "Copy"}
                    </button>
                  </div>

                  <p className="text-xs text-white/60 mt-2">{deal.minOrder}</p>
                </div>
              )}

              <button
                onClick={() => navigate(deal.route)}
                className="mt-8 bg-[#f6c441] text-green-950 px-7 py-3 rounded-xl font-black hover:bg-[#d6a84f]"
              >
                {deal.button} →
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-[#eadfcd] shadow-sm p-6 md:p-8 mt-8">
          <h2 className="text-2xl font-black text-green-900 mb-5">
            Điều kiện áp dụng
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {deal.condition.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 bg-[#fbf7ec] rounded-2xl p-4"
              >
                <CheckCircle className="w-5 h-5 text-[#d6a84f] shrink-0 mt-0.5" />
                <p className="text-gray-700 font-medium">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid md:grid-cols-2 gap-5">
          <button
            onClick={() => navigate("/menu")}
            className="bg-white border border-[#eadfcd] rounded-3xl p-6 text-left hover:shadow-md transition"
          >
            <Utensils className="w-8 h-8 text-[#c99a45]" />
            <h3 className="text-xl font-black text-green-900 mt-3">
              Xem thực đơn
            </h3>
            <p className="text-gray-600 text-sm mt-2">
              Chọn món ngon và áp dụng ưu đãi vào đơn hàng.
            </p>
          </button>

          <button
            onClick={() => navigate("/booking")}
            className="bg-white border border-[#eadfcd] rounded-3xl p-6 text-left hover:shadow-md transition"
          >
            <CalendarDays className="w-8 h-8 text-[#c99a45]" />
            <h3 className="text-xl font-black text-green-900 mt-3">
              Đặt bàn trước
            </h3>
            <p className="text-gray-600 text-sm mt-2">
              Giữ chỗ trước và nhận ưu đãi khi dùng bữa tại nhà hàng.
            </p>
          </button>
        </section>
      </main>
    </div>
  );
}

export default DealDetailPage;
