import { getAuthToken } from "../utils/auth";
import { API_BASE_URL } from "../config/api";

const API_URL = `${API_BASE_URL}/spaces`;

const getHeaders = () => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Có lỗi xảy ra.");
  }
  return data;
};

export const spaceService = {
  // Fetch active spaces (Public)
  async getActiveSpaces() {
    const res = await fetch(`${API_URL}/active`);
    return await handleResponse(res);
  },

  // Fetch all spaces for Admin (Protected)
  async getAdminSpaces() {
    const res = await fetch(`${API_URL}/admin-list`, {
      headers: getHeaders(),
    });
    return await handleResponse(res);
  },

  // Create new space (Protected)
  async createSpace(spaceData) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(spaceData),
    });
    return await handleResponse(res);
  },

  // Update space (Protected)
  async updateSpace(key, spaceData) {
    const res = await fetch(`${API_URL}/${key}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(spaceData),
    });
    return await handleResponse(res);
  },

  // Delete space (Protected)
  async deleteSpace(key) {
    const res = await fetch(`${API_URL}/${key}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return await handleResponse(res);
  },

  // Upload image (Protected)
  async uploadImage(file) {
    const formData = new FormData();
    formData.append("image", file);

    const token = getAuthToken();
    const res = await fetch(`${API_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        // Allow fetch to auto-set boundary for FormData
      },
      body: formData,
    });
    return await handleResponse(res);
  },
};
