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
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  return `${BACKEND_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};
