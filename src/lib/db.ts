import { createClient } from "@libsql/client";

function initializeDb() {
  try {
    const url = process.env.TURSO_DATABASE_URL?.trim();
    if (!url || url === "libsql://your-turso-database-url" || !url.includes("://")) {
      return createClient({ url: "file:./local.db" });
    }
    return createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN || "",
    });
  } catch (e) {
    console.error("Failed to initialize database client during module import:", e);
    // Fallback to local DB if the URL format was completely invalid to prevent 500 errors
    return createClient({ url: "file:./local.db" });
  }
}

export const db = initializeDb();


