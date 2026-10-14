import { API_BASE_URL } from "../config/api";

const API_URL = `${API_BASE_URL}/deals`;

const handleResponse = async (res) => {
  const data = await res.json();

  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Có lỗi xảy ra.");
  }

  return data;
};

export const dealService = {
  async getDeals() {
    const res = await fetch(API_URL);
    const data = await handleResponse(res);
    return data.deals || [];
  },

  async createDeal(deal) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(deal),
    });

    const data = await handleResponse(res);
    return data.deal;
  },

  async updateDeal(id, deal) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(deal),
    });

    const data = await handleResponse(res);
    return data.deal;
  },

  async deleteDeal(id) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    return handleResponse(res);
  },

  async uploadDealImage(file) {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`${API_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await handleResponse(res);
    return data.imageUrl;
  },

  async recalculateStats() {
    const res = await fetch(`${API_URL}/recalculate-stats`, {
      method: "POST",
    });

    return handleResponse(res);
  },
};
