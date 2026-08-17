/* eslint-disable @typescript-eslint/no-explicit-any */

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL;

if (!AUTH_API_URL) {
  throw new Error("Missing NEXT_PUBLIC_AUTH_API_URL environment variable");
}

async function fetcher<T = any>(
  url: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  data: any = null,
): Promise<T> {
  const isFormData =
    typeof FormData !== "undefined" && data instanceof FormData;

  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const headers: HeadersInit = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (data !== null && data !== undefined) {
    config.body = isFormData ? data : JSON.stringify(data);
  }

  let response = await fetch(`${AUTH_API_URL}${url}`, config);

  // Access token expired - check BEFORE throwing error
  if (response.status === 401) {
    const refreshToken =
      typeof window !== "undefined"
        ? localStorage.getItem("refreshToken")
        : null;

    if (refreshToken) {
      const refreshResponse = await fetch(`${AUTH_API_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken,
        }),
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();

        localStorage.setItem("accessToken", refreshData.accessToken);

        // Retry original request with new token
        const retryHeaders: HeadersInit = {
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
          Authorization: `Bearer ${refreshData.accessToken}`,
        };

        const retryConfig: RequestInit = {
          method,
          headers: retryHeaders,
        };

        if (data !== null && data !== undefined) {
          retryConfig.body = isFormData ? data : JSON.stringify(data);
        }

        response = await fetch(`${AUTH_API_URL}${url}`, retryConfig);
      }
    }
  }

  // Now check if response is ok AFTER handling 401
  if (!response.ok) {
    let errorMessage = "Something went wrong";

    try {
      const error = await response.json();

      errorMessage = error?.error?.message || error?.message || errorMessage;
    } catch {
      // Response is not JSON
    }

    throw new Error(errorMessage);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export { fetcher };
