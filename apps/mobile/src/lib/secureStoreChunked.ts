import * as SecureStore from 'expo-secure-store';

/**
 * expo-secure-store rejects values larger than ~2KB (the iOS keychain item
 * limit), failing the write *silently* on some platforms. A Supabase session
 * (access JWT + refresh token + user object) can exceed that, which would break
 * session persistence and silently sign users out on relaunch.
 *
 * This adapter transparently splits large values across multiple keychain
 * entries. The index key (`<key>`) stores the chunk count; each chunk lives at
 * `<key>.<i>`. Values written by an older build as a single raw string are
 * still readable (the count parse fails, so we return the raw value).
 */

// Conservative cap (bytes ≈ chars for the ASCII tokens Supabase stores).
const CHUNK_SIZE = 1800;
const MAX_CHUNKS = 50;

function chunkKey(key: string, index: number): string {
  return `${key}.${index}`;
}

function isChunkCount(value: string): boolean {
  return /^[0-9]+$/.test(value);
}

async function getItem(key: string): Promise<string | null> {
  const index = await SecureStore.getItemAsync(key);
  if (index === null) {
    return null;
  }

  // Legacy / non-chunked value written directly under the key.
  if (!isChunkCount(index)) {
    return index;
  }

  const count = Number(index);
  if (count === 0) {
    return '';
  }

  const parts: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const part = await SecureStore.getItemAsync(chunkKey(key, i));
    if (part === null) {
      // Corrupt/partial write: treat as missing rather than returning garbage.
      return null;
    }
    parts.push(part);
  }

  return parts.join('');
}

async function removeChunks(key: string): Promise<void> {
  const index = await SecureStore.getItemAsync(key);
  if (index !== null && isChunkCount(index)) {
    const count = Number(index);
    for (let i = 0; i < count; i += 1) {
      await SecureStore.deleteItemAsync(chunkKey(key, i));
    }
  }
  await SecureStore.deleteItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  // Clear any previous chunks first so a shorter value never leaves stale tails.
  await removeChunks(key);

  const chunks: string[] = [];
  for (let offset = 0; offset < value.length; offset += CHUNK_SIZE) {
    chunks.push(value.slice(offset, offset + CHUNK_SIZE));
  }
  if (chunks.length > MAX_CHUNKS) {
    throw new Error(
      `secureStoreChunked: value for "${key}" exceeds ${MAX_CHUNKS * CHUNK_SIZE} bytes.`
    );
  }

  for (let i = 0; i < chunks.length; i += 1) {
    await SecureStore.setItemAsync(chunkKey(key, i), chunks[i]!);
  }
  await SecureStore.setItemAsync(key, String(chunks.length));
}

async function removeItem(key: string): Promise<void> {
  await removeChunks(key);
}

/**
 * A storage adapter compatible with Supabase's `auth.storage` option that
 * transparently chunks large values to stay under the SecureStore size cap.
 */
export const chunkedSecureStoreAdapter = {
  getItem,
  setItem,
  removeItem,
};
