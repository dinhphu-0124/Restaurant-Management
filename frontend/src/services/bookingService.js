import { getAuthToken } from "../utils/auth";
import { API_BASE_URL } from "../config/api";

const API_URL = `${API_BASE_URL}/bookings`;

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

export const bookingService = {
  async getBookingAvailability(date) {
    const query = new URLSearchParams();

    if (date) {
      query.set("date", date);
    }

    const res = await fetch(`${API_URL}/availability?${query.toString()}`);

    const data = await handleResponse(res);

    return data.bookings || [];
  },

  async getBookings(params = {}) {
    const query = new URLSearchParams();

    if (params.status && params.status !== "all") {
      query.set("status", params.status);
    }

    if (params.search) {
      query.set("search", params.search);
    }

    if (params.date) {
      query.set("date", params.date);
    }

    const res = await fetch(`${API_URL}/admin?${query.toString()}`, {
      headers: authHeaders(),
    });

    const data = await handleResponse(res);
    return data.bookings || [];
  },

  async getMyBookings() {
    const res = await fetch(`${API_URL}/me`, {
      headers: authHeaders(),
    });

    const data = await handleResponse(res);
    return data.bookings || [];
  },

  async getMyBookingDetail(id) {
    const res = await fetch(`${API_URL}/me/${id}`, {
      headers: authHeaders(),
    });

    const data = await handleResponse(res);
    return data.booking;
  },

  async createBooking(newBooking) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(newBooking),
    });

    const data = await handleResponse(res);

    localStorage.setItem("currentBooking", JSON.stringify(data.booking));

    window.dispatchEvent(new Event("bookingsUpdated"));

    return data.booking;
  },

  async createAdminBooking(newBooking) {
    const res = await fetch(`${API_URL}/admin`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(newBooking),
    });

    const data = await handleResponse(res);

    window.dispatchEvent(new Event("bookingsUpdated"));

    return data.booking;
  },

  async updateBooking(id, payload) {
    const res = await fetch(`${API_URL}/admin/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await handleResponse(res);

    window.dispatchEvent(new Event("bookingsUpdated"));

    return data.booking;
  },

  async updateBookingStatus(id, status) {
    const res = await fetch(`${API_URL}/admin/${id}/status`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });

    const data = await handleResponse(res);

    window.dispatchEvent(new Event("bookingsUpdated"));

    return data.booking;
  },

  async deleteBooking(id) {
    const res = await fetch(`${API_URL}/admin/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    const data = await handleResponse(res);

    window.dispatchEvent(new Event("bookingsUpdated"));

    return data;
  },

  async updateBookingItems(id, cartItems) {
    const res = await fetch(`${API_URL}/admin/${id}/items`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ cartItems }),
    });

    const data = await handleResponse(res);

    window.dispatchEvent(new Event("bookingsUpdated"));

    return data.booking;
  },

  async confirmBookingPayment(id, paymentData) {
    const res = await fetch(`${API_URL}/admin/${id}/payment`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(paymentData),
    });

    const data = await handleResponse(res);

    window.dispatchEvent(new Event("bookingsUpdated"));

    return data.booking;
  },
};
