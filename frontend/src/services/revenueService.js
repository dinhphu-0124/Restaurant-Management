import { getAuthToken } from "../utils/auth";
import { API_BASE_URL } from "../config/api";

const API_URL = `${API_BASE_URL}/revenue`;

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getAuthToken()}`,
});

async function handleResponse(res) {
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Server không trả về dữ liệu hợp lệ.");
  }
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Có lỗi xảy ra.");
  }
  return data;
}

export async function getDashboardStats() {
  const res = await fetch(`${API_URL}/dashboard`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function getAdvancedDashboardData(filters = {}) {
  const queryParams = new URLSearchParams(filters).toString();
  const res = await fetch(`${API_URL}/advanced-dashboard?${queryParams}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function getRevenueChart() {
  const res = await fetch(`${API_URL}/chart`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function getDetailedReport() {
  const res = await fetch(`${API_URL}/report`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}
