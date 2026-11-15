const configuredApiUrl =
  process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:5000";

let apiBaseUrl: string;

if (configuredApiUrl.startsWith("/")) {
  if (configuredApiUrl !== "/api") {
    throw new Error("A relative NEXT_PUBLIC_API_URL must be exactly /api.");
  }

  apiBaseUrl = configuredApiUrl;
} else {
  const normalizedApiOrigin = configuredApiUrl.replace(/\/+$/, "");
  const parsedApiOrigin = new URL(normalizedApiOrigin);

  if (
    !["http:", "https:"].includes(parsedApiOrigin.protocol) ||
    parsedApiOrigin.pathname !== "/" ||
    parsedApiOrigin.search ||
    parsedApiOrigin.hash
  ) {
    throw new Error(
      "NEXT_PUBLIC_API_URL must be an HTTP(S) origin without a path, query, or fragment, or /api.",
    );
  }

  apiBaseUrl = `${normalizedApiOrigin}/api`;
}

export const API_BASE_URL = apiBaseUrl;
