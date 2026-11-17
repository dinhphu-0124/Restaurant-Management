import { getImageUrl } from "../config/api";

/**
 * Hiệu ứng hoạt họa (Animation) bay hình vòng cung nhảy lên vào vị trí giỏ hàng
 * Quỹ đạo đường cong Parabol vút lên cao trước khi lượn êm ái xuống giỏ hàng
 * @param {MouseEvent|Event|HTMLElement} eventOrElement - Sự kiện click hoặc phần tử nguồn
 * @param {string} imageUrl - Đường dẫn ảnh của món ăn
 */
export function flyToCartAnimation(eventOrElement, imageUrl, onComplete) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    onComplete?.();
    return;
  }

  try {
    // 1. Xác định tọa độ bắt đầu (vị trí nút bấm hoặc con trỏ chuột)
    let startX = window.innerWidth / 2;
    let startY = window.innerHeight / 2;

    const el =
      eventOrElement?.currentTarget ||
      eventOrElement?.target ||
      (eventOrElement instanceof HTMLElement ? eventOrElement : null);

    if (el && typeof el.getBoundingClientRect === "function") {
      const rect = el.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
    } else if (eventOrElement?.clientX && eventOrElement?.clientY) {
      startX = eventOrElement.clientX;
      startY = eventOrElement.clientY;
    }

    // 2. Xác định đích đến (Biểu tượng giỏ hàng ở Header)
    const isMobile = window.innerWidth < 1024;
    let cartTarget =
      document.getElementById(isMobile ? "cart-btn-mobile" : "cart-btn-desktop") ||
      document.getElementById("cart-btn-desktop") ||
      document.getElementById("cart-btn-mobile");

    if (!cartTarget || cartTarget.offsetParent === null) {
      const links = document.querySelectorAll('a[href="/cart"]');
      for (const link of links) {
        if (link.offsetParent !== null) {
          cartTarget = link;
          break;
        }
      }
    }

    let endX = window.innerWidth - 36;
    let endY = 32;

    if (cartTarget) {
      const cartRect = cartTarget.getBoundingClientRect();
      endX = cartRect.left + cartRect.width / 2;
      endY = cartRect.top + cartRect.height / 2;
    }

    // 3. Tạo phần tử bay (flying element clone)
    const flyingEl = document.createElement("div");
    flyingEl.className = "fixed pointer-events-none z-[999999]";
    flyingEl.style.left = "0px";
    flyingEl.style.top = "0px";
    flyingEl.style.width = "46px";
    flyingEl.style.height = "46px";
    flyingEl.style.borderRadius = "9999px";
    flyingEl.style.overflow = "hidden";
    flyingEl.style.boxShadow =
      "0 10px 25px -3px rgba(0, 0, 0, 0.3), 0 0 16px rgba(22, 163, 74, 0.4), 0 0 10px rgba(214, 168, 79, 0.6)";
    flyingEl.style.border = "2.5px solid #d6a84f";
    flyingEl.style.backgroundColor = "#ffffff";
    flyingEl.style.willChange = "transform, opacity";
    flyingEl.style.transform = `translate3d(${startX}px, ${startY}px, 0) translate(-50%, -50%) scale(0.75)`;

    // Ảnh món ăn bên trong phần tử bay
    const img = document.createElement("img");
    img.src = getImageUrl(imageUrl) || "/images/placeholder.jpg";
    img.alt = "";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.onerror = () => {
      img.src = "/images/placeholder.jpg";
    };
    flyingEl.appendChild(img);

    document.body.appendChild(flyingEl);

    // 4. Tính toán quỹ đạo đường cong Parabol hình vòng cung nhảy lên
    // y(t) = straightY(t) - archHeight * 4*t*(1-t)
    // Đường cong chuẩn vật lý: bật nảy vút lên cao (nhảy lên) rồi lượn êm vào giỏ
    const deltaX = endX - startX;
    const deltaY = endY - startY;

    // Giới hạn y tối thiểu để không bao giờ bị bay khuất khỏi mép trên màn hình
    const minAllowedY = 24;
    const midStraightY = startY + deltaY * 0.5;
    const maxArchHeight = Math.max(20, (midStraightY - minAllowedY) * 0.88);
    const idealArchHeight = Math.abs(deltaY) * 0.25 + 35;
    const H = Math.min(idealArchHeight, maxArchHeight);

    const steps = 36;
    const keyframes = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;

      // Trục ngang: di chuyển mượt mà, ban đầu hướng thẳng đứng lên trước khi vòng sang giỏ hàng
      const xProg = Math.pow(t, 1.12);
      const x = startX + deltaX * xProg;

      // Trục dọc: Parabol hình vòm cung nhảy lên
      const straightY = startY + deltaY * t;
      const arch = 4 * t * (1 - t) * H;
      const y = Math.max(minAllowedY, straightY - arch);

      // Kích thước: bật to lúc bắt đầu nhảy (0.75 -> 1.25) rồi thu nhỏ dần vào giỏ (0.18)
      let scale = 1;
      if (t < 0.15) {
        scale = 0.75 + (t / 0.15) * 0.5; // Bật nảy lên
      } else if (t < 0.75) {
        scale = 1.25 - ((t - 0.15) / 0.6) * 0.15; // Giữ rõ ràng khi bay
      } else {
        scale = 1.10 - ((t - 0.75) / 0.25) * 0.92; // Thu nhỏ chui vào giỏ
      }

      // Xoay tròn tự nhiên 1 chiều (không lắc lư qua lại gây cảm giác zic zac)
      const spinDir = deltaX >= 0 ? 1 : -1;
      const rotate = spinDir * (t * 360);

      // Độ mờ: hiển thị rõ suốt chặng bay, chỉ mờ dần ở 12% cuối khi lọt vào trong giỏ
      const opacity = t > 0.88 ? 1 - (t - 0.88) / 0.12 : 1;

      keyframes.push({
        transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${scale.toFixed(2)}) rotate(${rotate.toFixed(1)}deg)`,
        opacity: Number(opacity.toFixed(2)),
        offset: Number(t.toFixed(4)),
      });
    }

    // Thời gian bay chậm rãi, thư thả (1.25 giây) để người dùng kịp nhìn rõ vòng cung
    // Sử dụng easing "linear" vì 36 điểm toán học đã tự định hình quỹ đạo chuyển động mượt mà
    const animation = flyingEl.animate(keyframes, {
      duration: 1250,
      easing: "linear",
      fill: "forwards",
    });

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      flyingEl.remove();

      // Kích hoạt cập nhật số lượng và hiển thị thông báo khi icon chạm vào giỏ hàng
      if (typeof onComplete === "function") {
        try {
          onComplete();
        } catch (callbackErr) {
          console.error("Lỗi khi thực thi onComplete giỏ hàng:", callbackErr);
        }
      }

      // Hiệu ứng nảy (bounce) giỏ hàng khi món ăn tiếp đất
      if (cartTarget) {
        cartTarget.animate(
          [
            { transform: "scale(1)" },
            { transform: "scale(1.35) rotate(-6deg)" },
            { transform: "scale(1.18) rotate(4deg)" },
            { transform: "scale(1)" },
          ],
          {
            duration: 400,
            easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          }
        );
      }
    };

    animation.onfinish = cleanup;
    setTimeout(cleanup, 1600); // Đảm bảo dọn dẹp an toàn
  } catch (err) {
    console.error("Lỗi hiệu ứng bay vào giỏ hàng:", err);
    if (typeof onComplete === "function") {
      onComplete();
    }
  }
}
