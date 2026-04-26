import { createClient } from "@libsql/client/web";

function initializeDb() {
  try {
    const url = process.env.TURSO_DATABASE_URL?.trim();
    if (!url || url === "libsql://your-turso-database-url" || !url.includes("://")) {
      return createClient({ url: "http://127.0.0.1:8080" });
    }
    return createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN || "",
    });
  } catch (e) {
    console.error("Failed to initialize database client during module import:", e);
    // Fallback to dummy DB if the URL format was completely invalid to prevent 500 errors
    return createClient({ url: "http://127.0.0.1:8080" });
  }
}

export const db = initializeDb();


