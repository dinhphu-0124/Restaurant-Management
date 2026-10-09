import React from "react";
import {
  UtensilsCrossed,
  Utensils,
  ChefHat,
  Crown,
  Sparkles,
  Flame,
  CookingPot,
  Soup,
  Beef,
  Ham,
  Drumstick,
  Bird,
  Rabbit,
  Turtle,
  Bone,
  PawPrint,
  Footprints,
  Fish,
  FishSymbol,
  Shrimp,
  Shell,
  Snail,
  Wheat,
  Salad,
  Leaf,
  Layers,
  Package,
  CircleDot,
  ShieldCheck,
  Award,
  Heart,
  Star,
  Zap,
  Egg,
  EggFried,
  Apple,
  Cake,
  Beer,
  Wine,
  GlassWater,
  Coffee,
  CupSoda,
  Citrus,
  Waves,
  LayoutGrid,
  Circle,
  Gem,
} from "lucide-react";

// Lucide-styled Custom SVG for Goat (Dê núi Hương Sơn / Sừng dê)
export function Goat({ size = 20, className = "", ...props }) {
  return React.createElement(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: className,
      ...props,
    },
    React.createElement("path", { d: "M7 8C4 5 4 2 6 2c2.5 0 3.5 3 4 5" }),
    React.createElement("path", { d: "M17 8c3-3 3-6 1-6-2.5 0-3.5 3-4 5" }),
    React.createElement("path", { d: "M8 8h8l-1.5 8.5a3 3 0 0 1-5 0L8 8z" }),
    React.createElement("path", { d: "M8 9l-4 1 2 2" }),
    React.createElement("path", { d: "M16 9l4 1-2 2" }),
    React.createElement("circle", { cx: "10", cy: "11", r: "0.8", fill: "currentColor" }),
    React.createElement("circle", { cx: "14", cy: "11", r: "0.8", fill: "currentColor" }),
    React.createElement("path", { d: "M11 18.5l1 2.5 1-2.5" })
  );
}

// Lucide-styled Custom SVG for Pig (Thịt heo / Heo rừng / Heo sữa)
export function Pig({ size = 20, className = "", ...props }) {
  return React.createElement(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: className,
      ...props,
    },
    React.createElement("circle", { cx: "12", cy: "13", r: "7" }),
    React.createElement("path", { d: "M6 8l2-4 3 2" }),
    React.createElement("path", { d: "M18 8l-2-4-3 2" }),
    React.createElement("ellipse", { cx: "12", cy: "14.5", rx: "3", ry: "2" }),
    React.createElement("circle", { cx: "11", cy: "14.5", r: "0.6", fill: "currentColor" }),
    React.createElement("circle", { cx: "13", cy: "14.5", r: "0.6", fill: "currentColor" }),
    React.createElement("circle", { cx: "9.5", cy: "11", r: "0.8", fill: "currentColor" }),
    React.createElement("circle", { cx: "14.5", cy: "11", r: "0.8", fill: "currentColor" })
  );
}

// Lucide-styled Custom SVG for Frog (Món ếch / Ếch đồng)
export function Frog({ size = 20, className = "", ...props }) {
  return React.createElement(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: className,
      ...props,
    },
    React.createElement("circle", { cx: "7", cy: "8", r: "2.5" }),
    React.createElement("circle", { cx: "17", cy: "8", r: "2.5" }),
    React.createElement("circle", { cx: "7", cy: "8", r: "0.8", fill: "currentColor" }),
    React.createElement("circle", { cx: "17", cy: "8", r: "0.8", fill: "currentColor" }),
    React.createElement("path", { d: "M4.5 10c0 5 3.5 8 7.5 8s7.5-3 7.5-8c-1.5 0-2.5-.5-3.5-1.5-2.5 1-5.5 1-8 0C7 9.5 6 10 4.5 10z" }),
    React.createElement("path", { d: "M9 13.5c1.5 1 4.5 1 6 0" }),
    React.createElement("path", { d: "M5 16l-3 2 2 2" }),
    React.createElement("path", { d: "M19 16l3 2-2 2" })
  );
}

// Lucide-styled Custom SVG for Duck (Món vịt / Vịt cỏ / Vịt quay)
export function Duck({ size = 20, className = "", ...props }) {
  return React.createElement(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: className,
      ...props,
    },
    React.createElement("circle", { cx: "14", cy: "8", r: "3" }),
    React.createElement("path", { d: "M11 9c-1 3-3 5-6 6 0 3 3 5 8 5s8-2 8-5c0-3-4-4-5-8" }),
    React.createElement("path", { d: "M17 7l4 1-4 2z" }),
    React.createElement("circle", { cx: "14.5", cy: "7.5", r: "0.6", fill: "currentColor" }),
    React.createElement("path", { d: "M10 15c2-1 4-1 6 0" })
  );
}

// Lucide-styled Custom SVG for Squid (Con mực)
export function Squid({ size = 20, className = "", ...props }) {
  return React.createElement(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: className,
      ...props,
    },
    React.createElement("path", { d: "M12 2C9 4 7 8 7 13c0 1.5.5 2.5 1.5 3h7c1-.5 1.5-1.5 1.5-3 0-5-2-9-5-11z" }),
    React.createElement("path", { d: "M7 6c-2 1-3 3-3 5 0 1 .5 2 2 2" }),
    React.createElement("path", { d: "M17 6c2 1 3 3 3 5 0 1-.5 2-2 2" }),
    React.createElement("circle", { cx: "10", cy: "12", r: "0.8", fill: "currentColor" }),
    React.createElement("circle", { cx: "14", cy: "12", r: "0.8", fill: "currentColor" }),
    React.createElement("path", { d: "M9 16v5c0 .6-.4 1-1 1s-1-.4-1-1" }),
    React.createElement("path", { d: "M11 16v6c0 .6-.4 1-1 1" }),
    React.createElement("path", { d: "M13 16v6c0 .6.4 1 1 1" }),
    React.createElement("path", { d: "M15 16v5c0 .6.4 1 1 1s1-.4 1-1" })
  );
}

// Lucide-styled Custom SVG for Crab (Con cua)
export function Crab({ size = 20, className = "", ...props }) {
  return React.createElement(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: className,
      ...props,
    },
    React.createElement("ellipse", { cx: "12", cy: "14", rx: "6", ry: "4" }),
    React.createElement("path", { d: "M7 12c-2-2-3-5-1-7 2.5 0 4 3 3 5" }),
    React.createElement("path", { d: "M6 5c-1.5 1.5-2 3.5-.5 5" }),
    React.createElement("path", { d: "M17 12c2-2 3-5 1-7-2.5 0-4 3-3 5" }),
    React.createElement("path", { d: "M18 5c1.5 1.5 2 3.5.5 5" }),
    React.createElement("circle", { cx: "10", cy: "10", r: "0.8", fill: "currentColor" }),
    React.createElement("circle", { cx: "14", cy: "10", r: "0.8", fill: "currentColor" }),
    React.createElement("path", { d: "M6 14l-3 1 1 2" }),
    React.createElement("path", { d: "M6 16l-3 2 1 2" }),
    React.createElement("path", { d: "M18 14l3 1-1 2" }),
    React.createElement("path", { d: "M18 16l3 2-1 2" })
  );
}

export const ICON_MAP = {
  UtensilsCrossed,
  Utensils,
  ChefHat,
  Crown,
  Sparkles,
  Flame,
  CookingPot,
  Soup,
  Goat,
  Beef,
  Ham,
  Pig,
  Drumstick,
  Duck,
  Bird,
  Frog,
  Rabbit,
  Turtle,
  Bone,
  PawPrint,
  Footprints,
  Fish,
  FishSymbol,
  Shrimp,
  Squid,
  Crab,
  Shell,
  Snail,
  Wheat,
  Salad,
  Leaf,
  Layers,
  Package,
  CircleDot,
  ShieldCheck,
  Award,
  Heart,
  Star,
  Zap,
  Egg,
  EggFried,
  Apple,
  Cake,
  Beer,
  Wine,
  GlassWater,
  Coffee,
  CupSoda,
  Citrus,
  Waves,
  LayoutGrid,
  Circle,
  Gem,
};

export const CATEGORY_ICON_LIST = [
  // 🍖 THỊT & ĐỘNG VẬT / GIA CẦM
  { value: "Goat", label: "Dê núi Hương Sơn / Đặc sản dê", group: "Thịt & Động vật" },
  { value: "Beef", label: "Thịt bò / Bò tơ / Thịt tươi", group: "Thịt & Động vật" },
  { value: "Ham", label: "Thịt heo / Giò heo / Đùi muối", group: "Thịt & Động vật" },
  { value: "Pig", label: "Heo rừng / Heo mọi / Heo sữa", group: "Thịt & Động vật" },
  { value: "Drumstick", label: "Món gà / Đùi gà / Gà ta", group: "Thịt & Động vật" },
  { value: "Duck", label: "Món vịt / Vịt cỏ / Vịt quay", group: "Thịt & Động vật" },
  { value: "Bird", label: "Chim câu / Chim sẻ / Gia cầm", group: "Thịt & Động vật" },
  { value: "Frog", label: "Món ếch / Ếch đồng / Ếch xào", group: "Thịt & Động vật" },
  { value: "Rabbit", label: "Món thỏ / Thịt rừng", group: "Thịt & Động vật" },
  { value: "Turtle", label: "Món ba ba / Đồ quý", group: "Thịt & Động vật" },
  { value: "Bone", label: "Sườn cây / Sụn giòn / Xương hầm", group: "Thịt & Động vật" },
  { value: "PawPrint", label: "Món rừng / Đặc sản núi", group: "Thịt & Động vật" },
  { value: "EggFried", label: "Trứng ốp la / Trứng rán", group: "Thịt & Động vật" },

  // 🦐 HẢI SẢN & THỦY HẢI SẢN TƯƠI SỐNG
  { value: "Shrimp", label: "Món tôm / Tôm nướng / Tôm hấp", group: "Hải sản" },
  { value: "Squid", label: "Món mực / Mực xào / Mực hấp", group: "Hải sản" },
  { value: "Crab", label: "Món cua / Ghẹ hấp", group: "Hải sản" },
  { value: "Fish", label: "Món cá / Cá lẩu / Cá nướng", group: "Hải sản" },
  { value: "FishSymbol", label: "Hải sản tổng hợp", group: "Hải sản" },
  { value: "Shell", label: "Nghêu / Sò / Hàu nướng", group: "Hải sản" },
  { value: "Snail", label: "Món ốc / Ốc hương / Ốc bươu", group: "Hải sản" },
  { value: "Waves", label: "Đồ biển / Tươi sống", group: "Hải sản" },

  // 🍲 ẨM THỰC & CHẾ BIẾN
  { value: "ChefHat", label: "Món chính / Đầu bếp", group: "Món ăn" },
  { value: "UtensilsCrossed", label: "Tất cả món / Bàn tiệc", group: "Món ăn" },
  { value: "CookingPot", label: "Món hấp / Hầm / Xào", group: "Món ăn" },
  { value: "Soup", label: "Món lẩu / Súp / Canh", group: "Món ăn" },
  { value: "Flame", label: "Món nướng / BBQ / Chiên cay", group: "Món ăn" },
  { value: "Salad", label: "Món khai vị / Gỏi / Nộm", group: "Món ăn" },
  { value: "Wheat", label: "Ăn no / Cơm / Mì / Tinh bột", group: "Món ăn" },
  { value: "Leaf", label: "Món rau / Món chay / Rau tươi", group: "Món ăn" },
  { value: "CircleDot", label: "Dồi dê / Chả / Món cuộn", group: "Món ăn" },
  { value: "Egg", label: "Món trứng / Phụ gia", group: "Món ăn" },
  { value: "Utensils", label: "Món ăn chung / Món khác", group: "Món ăn" },

  // 🍺 ĐỒ UỐNG & TRÁNG MIỆNG
  { value: "Beer", label: "Bia tươi / Bia chai / Bia lon", group: "Đồ uống" },
  { value: "Wine", label: "Rượu ngâm / Rượu nếp / Rượu vang", group: "Đồ uống" },
  { value: "CupSoda", label: "Nước ngọt / Nước có ga", group: "Đồ uống" },
  { value: "GlassWater", label: "Nước suối / Đồ uống giải khát", group: "Đồ uống" },
  { value: "Coffee", label: "Cà phê / Trà nóng", group: "Đồ uống" },
  { value: "Citrus", label: "Nước ép / Sinh tố / Trái cây", group: "Đồ uống" },
  { value: "Apple", label: "Tráng miệng / Hoa quả tươi", group: "Đồ uống" },
  { value: "Cake", label: "Bánh ngọt / Tráng miệng", group: "Đồ uống" },

  // ⭐ ĐẶC SẢN & ĐẶC BIỆT
  { value: "Crown", label: "Ngọc Dương / Đặc sản thượng hạng", group: "Đặc biệt" },
  { value: "Sparkles", label: "Món đặc sắc / Tinh hoa", group: "Đặc biệt" },
  { value: "Award", label: "Món gia truyền / Top 1", group: "Đặc biệt" },
  { value: "Heart", label: "Món được yêu thích nhất", group: "Đặc biệt" },
  { value: "Star", label: "Món tiêu biểu 5 sao", group: "Đặc biệt" },
  { value: "Layers", label: "Combo / Set nhiều món", group: "Đặc biệt" },
  { value: "Package", label: "Set mang về / Hộp quà biếu", group: "Đặc biệt" },
  { value: "ShieldCheck", label: "Tươi sạch 100%", group: "Đặc biệt" },
  { value: "Zap", label: "Món gọi nhanh / Phục vụ tức thì", group: "Đặc biệt" },
  { value: "LayoutGrid", label: "Danh mục tổng hợp", group: "Khác" },
];

export const getCategoryIcon = (iconName) => {
  return ICON_MAP[iconName] || UtensilsCrossed;
};
