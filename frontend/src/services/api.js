const API_BASE_URL = "http://localhost:8000";

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("access_token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Support both relative URLs and full URLs
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

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
