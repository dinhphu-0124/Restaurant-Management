const safeParseUser = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const removeAuthData = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("avatar");
  localStorage.removeItem("adminToken");

  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("currentUser");
  sessionStorage.removeItem("isLoggedIn");
};

export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    const parsed = JSON.parse(jsonPayload);
    if (parsed && typeof parsed.exp === "number") {
      return Date.now() >= parsed.exp * 1000 - 5000;
    }
    return false;
  } catch {
    return false;
  }
};

export const getAuthToken = () => {
  const localToken = localStorage.getItem("authToken");
  const sessionToken = sessionStorage.getItem("authToken");

  let token = "";
  if (localToken && localToken !== "undefined" && localToken !== "null") {
    token = localToken;
  } else if (sessionToken && sessionToken !== "undefined" && sessionToken !== "null") {
    token = sessionToken;
  }

  if (token && isTokenExpired(token)) {
    removeAuthData();
    window.dispatchEvent(new Event("loginStatusChanged"));
    return "";
  }

  return token;
};

export const getCurrentUser = () => {
  const token = getAuthToken();
  if (!token) {
    return null;
  }

  const localUser = safeParseUser(localStorage.getItem("currentUser"));
  const sessionUser = safeParseUser(sessionStorage.getItem("currentUser"));

  return localUser || sessionUser;
};

export const checkLogin = () => {
  return Boolean(getAuthToken() && getCurrentUser());
};

export const isAdmin = () => {
  return getCurrentUser()?.role === "admin";
};

export const saveAuthSession = ({ token, user, remember = true }) => {
  removeAuthData();

  const storage = remember ? localStorage : sessionStorage;

  storage.setItem("authToken", token);
  storage.setItem("currentUser", JSON.stringify(user));
  storage.setItem("isLoggedIn", "true");

  if (user?.avatar) {
    localStorage.setItem("avatar", user.avatar);
  }

  window.dispatchEvent(new Event("loginStatusChanged"));
  window.dispatchEvent(new Event("avatarUpdated"));
};

export const clearAuthSession = () => {
  removeAuthData();

  window.dispatchEvent(new Event("loginStatusChanged"));
  window.dispatchEvent(new Event("avatarUpdated"));
};
