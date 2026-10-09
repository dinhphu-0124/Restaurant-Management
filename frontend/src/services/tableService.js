import { getAuthToken } from "../utils/auth";

const API_URL = "http://localhost:5001/api/tables";

const authHeaders = () => {
  const token = getAuthToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

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

const normalizeArea = (area) => ({
  ...area,
  id: String(area.id),
  spaceId: String(area.spaceId || area.id),
  areaId: String(area.areaId || area.id),
  name: area.label || area.name || area.title,
  title: area.label || area.name || area.title,
  label: area.label || area.name || area.title,
});

const normalizeTable = (table) => ({
  ...table,
  id: String(table.id),
  spaceId: String(table.spaceId || table.areaId),
  areaId: String(table.spaceId || table.areaId),
  areaName: table.areaName || table.spaceName || "",
  spaceName: table.spaceName || table.areaName || "",
  code: String(table.code || table.tableCode),
  tableCode: String(table.tableCode || table.code),
  capacity: Number(table.capacity || table.seats || 4),
  seats: Number(table.seats || table.capacity || 4),
  status: table.status || "available",
  description: table.description || "",
});

export const tableService = {
  async getAreas() {
    const res = await fetch(`${API_URL}/areas`, {
      headers: authHeaders(),
    });

    const data = await handleResponse(res);

    return (data.areas || []).map(normalizeArea);
  },

  async getTables() {
    const res = await fetch(API_URL, {
      headers: authHeaders(),
    });

    const data = await handleResponse(res);

    return (data.tables || []).map(normalizeTable);
  },

  async createArea(payload) {
    const res = await fetch(`${API_URL}/areas`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await handleResponse(res);
    window.dispatchEvent(new Event("tablesUpdated"));

    return normalizeArea(data.area);
  },

  async updateArea(id, payload) {
    const res = await fetch(`${API_URL}/areas/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await handleResponse(res);
    window.dispatchEvent(new Event("tablesUpdated"));

    return normalizeArea(data.area);
  },

  async deleteArea(id) {
    const res = await fetch(`${API_URL}/areas/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    const data = await handleResponse(res);
    window.dispatchEvent(new Event("tablesUpdated"));

    return data;
  },

  async createTable(payload) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await handleResponse(res);
    window.dispatchEvent(new Event("tablesUpdated"));

    return normalizeTable(data.table);
  },

  async updateTable(id, payload) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await handleResponse(res);
    window.dispatchEvent(new Event("tablesUpdated"));

    return normalizeTable(data.table);
  },

  async updateTableStatus(id, status) {
    const res = await fetch(`${API_URL}/${id}/status`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });

    const data = await handleResponse(res);
    window.dispatchEvent(new Event("tablesUpdated"));

    return normalizeTable(data.table);
  },

  async deleteTable(id) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    const data = await handleResponse(res);
    window.dispatchEvent(new Event("tablesUpdated"));

    return data;
  },
};
