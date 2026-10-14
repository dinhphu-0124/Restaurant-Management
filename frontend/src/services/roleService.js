import { getAuthToken } from "../utils/auth";
import { API_BASE_URL } from "../config/api";

const API_URL = `${API_BASE_URL}/roles`;

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

export async function getRoleUsers(params = {}) {
  const query = new URLSearchParams();

  if (params.search) query.set("search", params.search);
  if (params.role && params.role !== "all") query.set("role", params.role);

  const res = await fetch(`${API_URL}/users?${query.toString()}`, {
    headers: authHeaders(),
  });

  return handleResponse(res);
}

export async function updateUserRole(userId, role) {
  const res = await fetch(`${API_URL}/users/${userId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ role }),
  });

  return handleResponse(res);
}

export async function getUserActivities(userId) {
  const res = await fetch(`${API_URL}/users/${userId}/activities`, {
    headers: authHeaders(),
  });

  return handleResponse(res);
}

export async function getAdminRoleActivities() {
  const res = await fetch(`${API_URL}/admin-activities`, {
    headers: authHeaders(),
  });

  return handleResponse(res);
}
