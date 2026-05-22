import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { verifySupabaseToken } from "./supabaseAdmin";
import * as db from "../db";

export type AppUser = {
  id: number;
  supabaseId: string;
  email: string | null;
  role: string;
};

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: AppUser | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: AppUser | null = null;

  try {
    const authHeader = opts.req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const supabaseUser = await verifySupabaseToken(token);

      if (supabaseUser) {
        // Upsert user in our database
        await db.upsertUser({
          openId: supabaseUser.id,
          email: supabaseUser.email ?? null,
          name: supabaseUser.user_metadata?.name ?? supabaseUser.email ?? null,
          lastSignedIn: new Date(),
        });

        const dbUser = await db.getUserByOpenId(supabaseUser.id);
        if (dbUser) {
          user = {
            id: dbUser.id,
            supabaseId: supabaseUser.id,
            email: dbUser.email,
            role: dbUser.role,
          };
        }
      }
    }
  } catch (error) {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
