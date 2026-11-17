const getBackendUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined") {
    // Nếu đang chạy trên cổng dev Vite 5173 thì trỏ sang backend 5001
    if (window.location.port === "5173") {
      return `http://${window.location.hostname}:5001`;
    }
    // Nếu chạy cùng domain/port với server backend (production build hoặc tunnel)
    return window.location.origin;
  }
  return "http://localhost:5001";
};

export const BACKEND_URL = getBackendUrl();
export const API_BASE_URL = `${BACKEND_URL}/api`;

export const getImageUrl = (path) => {
  if (!path || typeof path !== "string") return "";

  // Giữ nguyên Data URI hoặc Blob URL
  if (path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }

  // Chuẩn hóa: Nếu chuỗi chứa domain localhost / 127.0.0.1 cũ thì gỡ bỏ để tái sử dụng linh hoạt
  let clean = path.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, "");

  // Nếu vẫn là link tuyệt đối từ các nguồn bên thứ ba (Cloudinary, Imgur, S3, Firebase...)
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }

  // Nếu là file tĩnh cục bộ của frontend (trong thư mục /public/images hoặc /src/assets)
  if (
    clean.startsWith("/images/") ||
    clean.startsWith("/src/assets/") ||
    clean.startsWith("/assets/")
  ) {
    return clean;
  }

  // Nếu là đường dẫn tương đối (như /uploads/...) cần nối với BACKEND_URL
  const relativePath = clean.startsWith("/") ? clean : `/${clean}`;
  return `${BACKEND_URL}${relativePath}`;
};
