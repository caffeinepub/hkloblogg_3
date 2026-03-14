import { Ed25519KeyIdentity } from "@dfinity/identity";

/**
 * Hash a password with SHA-256 using the Web Crypto API.
 * Returns raw bytes as Uint8Array.
 */
export async function hashPassword(password: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hashBuffer);
}

/**
 * Generate a random 16-byte salt.
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Hash password combined with salt for registration.
 * SHA-256(password + salt)
 */
export async function hashPasswordWithSalt(
  password: string,
  salt: Uint8Array,
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  const combined = new Uint8Array(passwordBytes.length + salt.length);
  combined.set(passwordBytes);
  combined.set(salt, passwordBytes.length);
  const hashBuffer = await crypto.subtle.digest("SHA-256", combined);
  return new Uint8Array(hashBuffer);
}

/**
 * Derive a deterministic Ed25519 identity from alias and password.
 * SHA-256(alias + ":" + password) is used as the 32-byte seed.
 * This ensures the same credentials always produce the same IC principal.
 */
export async function deriveIdentityFromCredentials(
  alias: string,
  password: string,
): Promise<Ed25519KeyIdentity> {
  const seed = await hashPassword(`${alias}:${password}`);
  return Ed25519KeyIdentity.generate(seed);
}
