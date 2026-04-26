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
      targetWeeks INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    await db.execute(`ALTER TABLE habits ADD COLUMN targetWeeks INTEGER DEFAULT 1`);
  } catch (e) {
    // Ignore error if column already exists
  }

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
      defaultsInitialized INTEGER DEFAULT 0,
      targetWeeks INTEGER DEFAULT 4,
      dailyGoal INTEGER DEFAULT 7
    );
  `);

  try {
    await db.execute(`ALTER TABLE user_settings ADD COLUMN targetWeeks INTEGER DEFAULT 4`);
    await db.execute(`ALTER TABLE user_settings ADD COLUMN dailyGoal INTEGER DEFAULT 7`);
  } catch (e) {
    // Ignore error if columns already exist
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS weight_logs (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      date TEXT NOT NULL,
      weight REAL NOT NULL,
      UNIQUE(userId, date)
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
        sql: "INSERT INTO habits (id, userId, name, category, emoji, color, targetWeeks) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [crypto.randomUUID(), userId, h.name, h.category, h.emoji, h.color, 1]
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
  const targetWeeks = parseInt(formData.get("targetWeeks") as string) || 1;
  const userId = session.user.email;
  const id = crypto.randomUUID();

  await db.execute({
    sql: "INSERT INTO habits (id, userId, name, category, emoji, color, targetWeeks) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [id, userId, name, category, emoji, color, targetWeeks]
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

export async function editHabit(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const emoji = formData.get("emoji") as string;
  const color = formData.get("color") as string;
  const category = formData.get("category") as string;
  const targetWeeks = parseInt(formData.get("targetWeeks") as string) || 1;
  
  await db.execute({
    sql: "UPDATE habits SET name = ?, emoji = ?, color = ?, category = ?, targetWeeks = ? WHERE id = ? AND userId = ?",
    args: [name, emoji, color, category, targetWeeks, id, session.user.email]
  });

  revalidatePath("/");
}

export async function getUserSettings() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const result = await db.execute({
    sql: "SELECT * FROM user_settings WHERE userId = ?",
    args: [session.user.email]
  });

  return result.rows[0] as any;
}

export async function updateUserSettings(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");

  const targetWeeks = parseInt(formData.get("targetWeeks") as string) || 4;
  const dailyGoal = parseInt(formData.get("dailyGoal") as string) || 7;

  await db.execute({
    sql: "UPDATE user_settings SET targetWeeks = ?, dailyGoal = ? WHERE userId = ?",
    args: [targetWeeks, dailyGoal, session.user.email]
  });

  revalidatePath("/");
}

export async function logWeight(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");

  const weight = parseFloat(formData.get("weight") as string);
  const date = formData.get("date") as string;
  const userId = session.user.email;
  const id = crypto.randomUUID();

  if (isNaN(weight)) throw new Error("Invalid weight");

  await db.execute({
    sql: `
      INSERT INTO weight_logs (id, userId, date, weight) 
      VALUES (?, ?, ?, ?)
      ON CONFLICT(userId, date) DO UPDATE SET weight = excluded.weight
    `,
    args: [id, userId, date, weight]
  });

  revalidatePath("/");
}

export async function getWeights(startDate: string, endDate: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return [];

  const result = await db.execute({
    sql: "SELECT * FROM weight_logs WHERE userId = ? AND date >= ? AND date <= ? ORDER BY date DESC",
    args: [session.user.email, startDate, endDate]
  });

  return result.rows as any;
}
