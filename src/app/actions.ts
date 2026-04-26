"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "./api/auth/[...nextauth]/route";

export async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      emoji TEXT,
      color TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS completions (
      id TEXT PRIMARY KEY,
      habitId TEXT NOT NULL,
      date TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      UNIQUE(habitId, date)
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_settings (
      userId TEXT PRIMARY KEY,
      defaultsInitialized INTEGER DEFAULT 0
    );
  `);
}

export async function getHabits() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return [];

  const userId = session.user.email; // Using email as user identifier for simplicity
  
  // Check if defaults have been initialized
  const settings = await db.execute({
    sql: "SELECT * FROM user_settings WHERE userId = ?",
    args: [userId]
  });

  if (settings.rows.length === 0) {
    // Insert default habits from the user's list
    const defaultHabits = [
      { name: "Wake up at 05:00", emoji: "⏰", color: "#f87171", category: "Health" },
      { name: "Gym", emoji: "💪", color: "#facc15", category: "Health" },
      { name: "Stop Watching Porn", emoji: "💦", color: "#60a5fa", category: "Mindfulness" },
      { name: "Reading / Learning", emoji: "📖", color: "#34d399", category: "Learning" },
      { name: "Budget Tracking", emoji: "💰", color: "#a78bfa", category: "Productivity" },
      { name: "Project Work", emoji: "🎯", color: "#fb923c", category: "Productivity" },
      { name: "No Alcohol", emoji: "🍾", color: "#ef4444", category: "Health" },
      { name: "Social Media Detox", emoji: "🌿", color: "#4ade80", category: "Mindfulness" },
      { name: "Goal Journaling", emoji: "📝", color: "#fbbf24", category: "Mindfulness" },
      { name: "Cold Shower", emoji: "🚿", color: "#38bdf8", category: "Health" }
    ];

    for (const h of defaultHabits) {
      await db.execute({
        sql: "INSERT INTO habits (id, userId, name, category, emoji, color) VALUES (?, ?, ?, ?, ?, ?)",
        args: [crypto.randomUUID(), userId, h.name, h.category, h.emoji, h.color]
      });
      // Small delay to ensure correct ASC sorting order based on timestamp
      await new Promise(resolve => setTimeout(resolve, 50)); 
    }

    await db.execute({
      sql: "INSERT INTO user_settings (userId, defaultsInitialized) VALUES (?, 1)",
      args: [userId]
    });
  }

  const result = await db.execute({
    sql: "SELECT * FROM habits WHERE userId = ? ORDER BY createdAt ASC",
    args: [userId]
  });

  return result.rows as any;
}

export async function addHabit(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const emoji = formData.get("emoji") as string;
  const color = formData.get("color") as string;
  const category = formData.get("category") as string;
  const userId = session.user.email;
  const id = crypto.randomUUID();

  await db.execute({
    sql: "INSERT INTO habits (id, userId, name, category, emoji, color) VALUES (?, ?, ?, ?, ?, ?)",
    args: [id, userId, name, category, emoji, color]
  });

  revalidatePath("/");
}

export async function toggleCompletion(habitId: string, date: string, currentStatus: boolean) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");

  const newStatus = currentStatus ? 0 : 1;
  const id = crypto.randomUUID();

  // Upsert pattern
  await db.execute({
    sql: `
      INSERT INTO completions (id, habitId, date, completed) 
      VALUES (?, ?, ?, ?)
      ON CONFLICT(habitId, date) DO UPDATE SET completed = excluded.completed
    `,
    args: [id, habitId, date, newStatus]
  });

  revalidatePath("/");
}

export async function getCompletions(startDate: string, endDate: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return [];
  const userId = session.user.email;

  const result = await db.execute({
    sql: `
      SELECT c.* FROM completions c
      JOIN habits h ON c.habitId = h.id
      WHERE h.userId = ? AND c.date >= ? AND c.date <= ?
    `,
    args: [userId, startDate, endDate]
  });

  return result.rows as any;
}

export async function deleteHabit(habitId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");

  await db.execute({
    sql: "DELETE FROM habits WHERE id = ? AND userId = ?",
    args: [habitId, session.user.email]
  });
  
  await db.execute({
    sql: "DELETE FROM completions WHERE habitId = ?",
    args: [habitId]
  });

  revalidatePath("/");
}
