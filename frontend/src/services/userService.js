import { getAuthToken } from "../utils/auth";
import { API_BASE_URL } from "../config/api";

const API_URL = `${API_BASE_URL}/users`;

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

export async function getUsers() {
  const res = await fetch(API_URL, {
    headers: authHeaders(),
  });

  return handleResponse(res);
}

export async function getMe() {
  const res = await fetch(`${API_URL}/me`, {
    headers: authHeaders(),
  });

  return handleResponse(res);
}

export async function updateMe(payload) {
  const res = await fetch(`${API_URL}/me`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
}

export async function updateUserStatus(userId, status) {
  const res = await fetch(`${API_URL}/${userId}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });

  return handleResponse(res);
}

export async function deleteUserById(userId) {
  const res = await fetch(`${API_URL}/${userId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  return handleResponse(res);
}

export async function bulkUpdateUserStatus(ids, status) {
  const res = await fetch(`${API_URL}/bulk-status`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ ids, status }),
  });

  return handleResponse(res);
}

export async function bulkDeleteUsers(ids) {
  const res = await fetch(`${API_URL}/bulk-delete`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ ids }),
  });

  return handleResponse(res);
}
