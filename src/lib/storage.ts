import { createClient } from "@/lib/supabase";

const BUCKET_NAME = "attachments";

/**
 * Upload a file to Supabase Storage.
 * Path format: {workspaceId}/{folder}/{timestamp}_{filename}
 */
export async function uploadFile(
  workspaceId: string,
  folder: string,
  file: File
): Promise<{ path: string; url: string }> {
  const supabase = createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${workspaceId}/${folder}/${Date.now()}_${safeName}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const url = getPublicUrl(path);
  return { path, url };
}

/**
 * Upload a base64 data URL to Supabase Storage.
 * Converts to Blob first, then uploads.
 */
export async function uploadDataUrl(
  workspaceId: string,
  folder: string,
  dataUrl: string,
  filename: string
): Promise<{ path: string; url: string }> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], filename, { type: blob.type });
  return uploadFile(workspaceId, folder, file);
}

/**
 * Delete a file from Supabase Storage.
 */
export async function deleteFile(path: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

/**
 * Get the public URL for a file in Supabase Storage.
 */
export function getPublicUrl(path: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Check if a string is a Supabase Storage URL (vs a base64 data URI).
 */
export function isStorageUrl(value: string): boolean {
  return !value.startsWith("data:");
}
