import "server-only";

import { cookies, headers } from "next/headers";
import { randomBytes, createHash } from "crypto";
import { SiweMessage } from "siwe";
import { env } from "@/lib/env";
import { normalizeAddress } from "@/lib/validation";
import { getSupabaseServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

const SESSION_COOKIE = "wallet_profile_session";
const NONCE_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createProfileNonce(address: string) {
  if (!hasSupabaseConfig()) throw new Error("Supabase is required for wallet authentication.");
  const normalizedAddress = normalizeAddress(address);
  const nonce = randomBytes(16).toString("hex");
  const supabase = getSupabaseServiceClient();

  await supabase.from("profile_auth_nonces").insert({
    address: normalizedAddress,
    nonce,
    expires_at: new Date(Date.now() + NONCE_TTL_MS).toISOString()
  });

  return {
    nonce,
    address: normalizedAddress,
    message: [
      "Wallet Intelligence",
      "",
      "Sign this message to verify wallet ownership and manage your profile.",
      "",
      `Wallet: ${normalizedAddress}`,
      "This does not create a transaction or grant spending permissions."
    ].join("\n")
  };
}

export async function verifyProfileSignature(input: { message: string; signature: string }) {
  if (!hasSupabaseConfig()) throw new Error("Supabase is required for wallet authentication.");
  const siwe = new SiweMessage(input.message);
  const headerStore = await headers();
  const host = headerStore.get("host") ?? new URL(env.NEXT_PUBLIC_APP_URL).host;
  const verification = await siwe.verify({
    signature: input.signature,
    domain: host
  });
  if (!verification.success) throw new Error("Signature verification failed.");

  const address = normalizeAddress(siwe.address);
  const supabase = getSupabaseServiceClient();
  const { data: nonceRecord } = await supabase
    .from("profile_auth_nonces")
    .select("*")
    .eq("address", address)
    .eq("nonce", siwe.nonce)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!nonceRecord) throw new Error("Sign-in nonce is invalid or expired.");

  const { data: profile } = await supabase.from("wallet_profiles").select("id").eq("address", address).maybeSingle();
  if (!profile) throw new Error("Analyze this wallet before managing its profile.");

  const sessionToken = randomBytes(32).toString("hex");
  await Promise.all([
    supabase.from("profile_auth_nonces").update({ used_at: new Date().toISOString() }).eq("id", nonceRecord.id),
    supabase.from("wallet_profiles").update({ owner_address: address, owner_verified_at: new Date().toISOString() }).eq("id", profile.id),
    supabase.from("profile_sessions").insert({
      wallet_id: profile.id,
      address,
      session_token_hash: hashToken(sessionToken),
      expires_at: new Date(Date.now() + SESSION_TTL_MS).toISOString()
    })
  ]);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NEXT_PUBLIC_APP_URL.startsWith("https://"),
    path: "/",
    expires: new Date(Date.now() + SESSION_TTL_MS)
  });

  return { address };
}

export async function getVerifiedProfileOwner() {
  if (!hasSupabaseConfig()) return null;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionToken) return null;

  const supabase = getSupabaseServiceClient();
  const { data } = await supabase
    .from("profile_sessions")
    .select("address,wallet_id,expires_at")
    .eq("session_token_hash", hashToken(sessionToken))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!data) return null;
  return { address: normalizeAddress(data.address), walletId: data.wallet_id as string };
}

export async function assertProfileOwner(address: string) {
  const owner = await getVerifiedProfileOwner();
  const normalizedAddress = normalizeAddress(address);
  if (!owner || owner.address !== normalizedAddress) throw new Error("Only the verified wallet owner can manage this profile.");
  return owner;
}

export async function clearProfileSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  cookieStore.delete(SESSION_COOKIE);
  if (!sessionToken || !hasSupabaseConfig()) return;
  await getSupabaseServiceClient().from("profile_sessions").delete().eq("session_token_hash", hashToken(sessionToken));
}

export async function buildSiweMessage(address: string, nonce: string) {
  const headerStore = await headers();
  const host = headerStore.get("host") ?? new URL(env.NEXT_PUBLIC_APP_URL).host;
  return new SiweMessage({
    domain: host,
    address,
    statement: "Sign in to manage your Wallet Intelligence profile. This is read-only and does not create a transaction.",
    uri: env.NEXT_PUBLIC_APP_URL,
    version: "1",
    chainId: 8453,
    nonce
  }).prepareMessage();
}
