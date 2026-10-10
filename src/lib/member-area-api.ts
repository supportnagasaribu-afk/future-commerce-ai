export type MemberUser = {
  id: string;
  email: string;
  app_metadata?: { role?: string; [key: string]: unknown };
  user_metadata?: { full_name?: string; [key: string]: unknown };
};

export type MemberSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: MemberUser;
};

export type MemberProfile = {
  id: string;
  email: string;
  full_name: string;
  commerce_role: "buyer" | "seller" | "supplier" | "partner";
  referral_code: string;
  referred_by_id: string | null;
  created_at: string;
};

export type MemberAccount = {
  user_id: string;
  membership_type: "gold";
  account_status: "active" | "suspended";
  points_balance: number;
};

export type SupportRequest = {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
};

export type PointsTransaction = {
  id: string;
  member_id: string;
  member_email: string;
  amount: number;
  reason: string;
  balance_after: number;
  admin_id: string | null;
  admin_email: string;
  created_at: string;
};

export type ReferralRelationship = {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  created_at: string;
};

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://bzrhhuupcnfgxejndxjo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_MzM7ufbE0ajl9uk4eowbtw_eJNpjofH";
const SESSION_KEY = "barangviral.member.session";

function authHeaders(accessToken?: string) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${accessToken || SUPABASE_PUBLISHABLE_KEY}`,
    "Content-Type": "application/json",
  };
}

async function readResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body?.msg || body?.message || body?.error_description || body?.error || "Permintaan tidak berjaya. Cuba lagi.";
    throw new Error(typeof message === "string" ? message : "Permintaan tidak berjaya. Cuba lagi.");
  }
  return body as T;
}

function saveSession(session: MemberSession | null) {
  if (typeof window === "undefined") return;
  if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(SESSION_KEY);
}

export async function signIn(email: string, password: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email: email.trim(), password }),
  });
  const data = await readResponse<MemberSession>(response);
  saveSession(data);
  return data;
}

export async function signUp(input: {
  email: string;
  password: string;
  fullName: string;
  commerceRole: MemberProfile["commerce_role"];
  referralCode: string;
}) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email: input.email.trim(),
      password: input.password,
      data: {
        full_name: input.fullName.trim(),
        commerce_role: input.commerceRole,
        referral_code: input.referralCode.trim().toUpperCase(),
      },
    }),
  });
  const data = await readResponse<{ user: MemberUser; session?: MemberSession | null }>(response);
  if (data.session) saveSession(data.session);
  return data;
}

export async function sendPasswordReset(email: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/recover?redirect_to=${encodeURIComponent(window.location.origin + "/members")}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email: email.trim() }),
  });
  await readResponse<unknown>(response);
}

export async function signOut(session: MemberSession) {
  try {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: authHeaders(session.access_token),
    });
  } finally {
    saveSession(null);
  }
}

async function refreshSession(session: MemberSession): Promise<MemberSession> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  const next = await readResponse<MemberSession>(response);
  saveSession(next);
  return next;
}

export async function restoreSession(): Promise<MemberSession | null> {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(SESSION_KEY);
  if (!stored) return null;

  let session: MemberSession;
  try {
    session = JSON.parse(stored) as MemberSession;
    if (!session?.access_token || !session?.refresh_token || !session?.user?.id) throw new Error("Sesi tidak sah");
  } catch {
    saveSession(null);
    return null;
  }

  if (session.expires_at && session.expires_at <= Math.floor(Date.now() / 1000) + 60) {
    try {
      return await refreshSession(session);
    } catch {
      saveSession(null);
      return null;
    }
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: authHeaders(session.access_token),
  });
  if (response.ok) {
    const user = (await response.json()) as MemberUser;
    const current = { ...session, user };
    saveSession(current);
    return current;
  }
  try {
    return await refreshSession(session);
  } catch {
    saveSession(null);
    return null;
  }
}

export async function databaseRequest<T>(
  path: string,
  session: MemberSession,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...authHeaders(session.access_token),
      Prefer: "return=representation",
      ...(init.headers || {}),
    },
  });
  return readResponse<T>(response);
}

export async function loadMemberArea(session: MemberSession) {
  const id = encodeURIComponent(session.user.id);
  const [profiles, accounts, points, support, referrals] = await Promise.all([
    databaseRequest<MemberProfile[]>(`member_profiles?select=*&id=eq.${id}&limit=1`, session),
    databaseRequest<MemberAccount[]>(`member_accounts?select=*&user_id=eq.${id}&limit=1`, session),
    databaseRequest<PointsTransaction[]>(
      `points_transactions?select=*&member_id=eq.${id}&order=created_at.desc&limit=20`,
      session,
    ),
    databaseRequest<SupportRequest[]>(
      `support_requests?select=*&user_id=eq.${id}&order=created_at.desc&limit=20`,
      session,
    ),
    databaseRequest<ReferralRelationship[]>(
      `referral_relationships?select=id,referrer_id,referred_user_id,created_at&referrer_id=eq.${id}&order=created_at.desc&limit=100`,
      session,
    ),
  ]);
  if (!profiles[0] || !accounts[0]) {
    throw new Error("Profil ahli belum tersedia. Cuba muat semula beberapa saat lagi.");
  }
  return {
    profile: profiles[0],
    account: accounts[0],
    points,
    support,
    referrals,
  };
}

export async function loadAdminMembers(session: MemberSession) {
  const [profiles, accounts] = await Promise.all([
    databaseRequest<MemberProfile[]>("member_profiles?select=*&order=created_at.desc&limit=250", session),
    databaseRequest<MemberAccount[]>("member_accounts?select=*&limit=250", session),
  ]);
  return profiles.map((profile) => ({
    ...profile,
    account: accounts.find((account) => account.user_id === profile.id) ?? null,
  }));
}

export async function loadAdminSupport(session: MemberSession) {
  return databaseRequest<SupportRequest[]>(
    "support_requests?select=*&order=created_at.desc&limit=250",
    session,
  );
}

export async function updateMemberProfile(
  session: MemberSession,
  input: Pick<MemberProfile, "full_name" | "commerce_role">,
) {
  return databaseRequest<MemberProfile[]>(
    `member_profiles?id=eq.${encodeURIComponent(session.user.id)}`,
    session,
    { method: "PATCH", body: JSON.stringify(input) },
  );
}

export async function createSupportRequest(session: MemberSession, subject: string, message: string) {
  return databaseRequest<SupportRequest[]>("support_requests", session, {
    method: "POST",
    body: JSON.stringify({ user_id: session.user.id, subject: subject.trim(), message: message.trim() }),
  });
}

export async function updateSupportStatus(
  session: MemberSession,
  requestId: string,
  status: SupportRequest["status"],
) {
  return databaseRequest<SupportRequest[]>(
    `support_requests?id=eq.${encodeURIComponent(requestId)}`,
    session,
    { method: "PATCH", body: JSON.stringify({ status }) },
  );
}

export async function adjustMemberPoints(
  session: MemberSession,
  memberId: string,
  amount: number,
  reason: string,
) {
  return databaseRequest<PointsTransaction>("rpc/adjust_member_points", session, {
    method: "POST",
    body: JSON.stringify({ p_member_id: memberId, p_amount: amount, p_reason: reason.trim() }),
  });
}

export async function setMemberStatus(
  session: MemberSession,
  memberId: string,
  status: MemberAccount["account_status"],
) {
  return databaseRequest<null>("rpc/admin_set_member_status", session, {
    method: "POST",
    body: JSON.stringify({ p_member_id: memberId, p_account_status: status }),
  });
}
