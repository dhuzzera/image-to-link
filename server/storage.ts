import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const BUCKET_NAME = "Imagetolink";

function getSupabaseStorage() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Storage config missing: set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = Math.random().toString(36).slice(2, 10);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const supabase = getSupabaseStorage();
  const key = appendHashSuffix(normalizeKey(relKey));

  const fileData = typeof data === "string" ? Buffer.from(data) : data;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(key, fileData, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(key);

  return { key, url: urlData.publicUrl };
}

export async function storageDelete(relKey: string): Promise<boolean> {
  try {
    const supabase = getSupabaseStorage();
    const key = normalizeKey(relKey);

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([key]);

    if (error) {
      console.warn(`[Storage] Delete failed for key ${key}: ${error.message}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Storage] Delete error:", error);
    return false;
  }
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const supabase = getSupabaseStorage();
  const key = normalizeKey(relKey);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(key, 3600); // 1 hour

  if (error || !data?.signedUrl) {
    throw new Error(`Storage signed URL failed: ${error?.message}`);
  }

  return data.signedUrl;
}
