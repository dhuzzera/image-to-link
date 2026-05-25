import { and, desc, eq, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertImage, InsertUser, images, users } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const connectionString = process.env.DATABASE_URL;
      const client = postgres(connectionString, {
        ssl: 'require',
        max: 5,
        idle_timeout: 20,
        connect_timeout: 10,
      });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // Check if user exists
    const existing = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);

    if (existing.length > 0) {
      // Update existing user
      const updateData: Record<string, unknown> = {
        lastSignedIn: user.lastSignedIn ?? new Date(),
      };
      if (user.name !== undefined) updateData.name = user.name;
      if (user.email !== undefined) updateData.email = user.email;
      if (user.loginMethod !== undefined) updateData.loginMethod = user.loginMethod;
      if (user.role !== undefined) updateData.role = user.role;

      await db.update(users).set(updateData).where(eq(users.openId, user.openId));
    } else {
      // Insert new user
      await db.insert(users).values({
        openId: user.openId,
        name: user.name ?? null,
        email: user.email ?? null,
        loginMethod: user.loginMethod ?? null,
        role: user.role ?? "user",
        lastSignedIn: user.lastSignedIn ?? new Date(),
      });
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserImages(
  userId: number,
  options?: { page?: number; pageSize?: number; search?: string }
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get images: database not available");
    return { images: [], total: 0, page: 1, pageSize: 12, totalPages: 0 };
  }

  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 12;
  const search = options?.search;

  try {
    const conditions = [eq(images.userId, userId)];
    if (search) {
      conditions.push(like(images.fileName, `%${search}%`));
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(images)
      .where(whereClause);
    const total = Number(countResult[0]?.count ?? 0);

    // Get paginated results
    const result = await db
      .select()
      .from(images)
      .where(whereClause)
      .orderBy(desc(images.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return {
      images: result,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error("[Database] Failed to get user images:", error);
    throw error;
  }
}

export async function createImage(image: InsertImage) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create image: database not available");
    return undefined;
  }

  try {
    const result = await db.insert(images).values(image);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create image:", error);
    throw error;
  }
}

export async function deleteImage(imageId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete image: database not available");
    return false;
  }

  try {
    await db
      .delete(images)
      .where(and(eq(images.id, imageId), eq(images.userId, userId)));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete image:", error);
    throw error;
  }
}

export async function getImageById(imageId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get image: database not available");
    return undefined;
  }

  try {
    const result = await db
      .select()
      .from(images)
      .where(and(eq(images.id, imageId), eq(images.userId, userId)))
      .limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get image:", error);
    throw error;
  }
}
