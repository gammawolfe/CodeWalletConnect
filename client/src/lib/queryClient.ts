import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Cache for CSRF token to avoid fetching on every request
let csrfTokenCache: string | null = null;

async function getCsrfToken(): Promise<string> {
  if (csrfTokenCache) {
    return csrfTokenCache;
  }

  const res = await fetch("/api/csrf-token", {
    credentials: "include",
  });
  
  if (!res.ok) {
    throw new Error("Failed to fetch CSRF token");
  }
  
  const data = await res.json();
  csrfTokenCache = data.csrfToken;
  return data.csrfToken;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};
  
  // Add Content-Type for requests with data
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add CSRF token for state-changing operations
  const needsCsrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
  if (needsCsrf) {
    try {
      const csrfToken = await getCsrfToken();
      headers["X-CSRF-Token"] = csrfToken;
    } catch (error) {
      // If CSRF token fetch fails, continue without it
      // The server will return 403 which will be handled by error handling
      console.warn("Failed to fetch CSRF token:", error);
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Clear CSRF token cache on 403 errors (token might be invalid)
  if (res.status === 403 && needsCsrf) {
    csrfTokenCache = null;
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
