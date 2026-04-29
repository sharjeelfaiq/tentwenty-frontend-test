export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

interface RequestOptions extends RequestInit {
  query?: Record<string, string | undefined>;
}

function withQuery(path: string, query?: RequestOptions["query"]) {
  if (!query) {
    return `${API_BASE_URL}${path}`;
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value) {
      params.set(key, value);
    }
  }

  const queryString = params.toString();
  return `${API_BASE_URL}${path}${queryString ? `?${queryString}` : ""}`;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { query, headers, body, ...rest } = options;

  const response = await fetch(withQuery(path, query), {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? ((await response.json()) as T | { error?: string; fieldErrors?: Record<string, string> }) : null;

  if (!response.ok) {
    const errorMessage =
      payload && typeof payload === "object" && "error" in payload && payload.error
        ? payload.error
        : "Request failed";
    const fieldErrors =
      payload && typeof payload === "object" && "fieldErrors" in payload && payload.fieldErrors
        ? payload.fieldErrors
        : undefined;

    throw new ApiError(errorMessage, response.status, fieldErrors);
  }

  return payload as T;
}
