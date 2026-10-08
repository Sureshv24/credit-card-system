const API_BASE_URL = "http://127.0.0.1:8000";

function getAccessToken() {
  return localStorage.getItem("access_token");
}

function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}

function saveTokens(data) {
  if (data?.access) {
    localStorage.setItem("access_token", data.access);
  }

  if (data?.refresh) {
    localStorage.setItem("refresh_token", data.refresh);
  }
}

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/auth/token/refresh/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh: refreshToken,
        }),
      }
    );

    if (!response.ok) {
      logoutStorage();
      return false;
    }

    const data = await response.json();

    saveTokens(data);

    return true;
  } catch (error) {
    console.error("Token refresh failed:", error);
    logoutStorage();
    return false;
  }
}

export async function apiRequest(endpoint, options = {}) {
  const {
    skipAuth = false,
    _retry = false,
    ...requestOptions
  } = options;

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...(requestOptions.headers || {}),
  };

  if (!skipAuth) {
    const token = getAccessToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response = await fetch(url, {
    ...requestOptions,
    headers,
  });

  /*
   * If the access token expired, refresh it once
   * and retry the original request.
   */
  if (
    response.status === 401 &&
    !skipAuth &&
    !_retry &&
    !endpoint.includes("/api/auth/login/") &&
    !endpoint.includes("/api/auth/token/refresh/")
  ) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      const newToken = getAccessToken();

      const retryHeaders = {
        ...headers,
        Authorization: `Bearer ${newToken}`,
      };

      response = await fetch(url, {
        ...requestOptions,
        headers: retryHeaders,
      });
    }
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(
      data?.detail || "Request failed."
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}

export function logoutStorage() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export { API_BASE_URL };