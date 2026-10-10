import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft, ArrowRight, BadgeCheck, Copy, Gift, LayoutDashboard,
  Loader2, LogOut, ShieldCheck, Sparkles, Ticket, Users, Wallet,
} from "lucide-react";
import {
  adjustMemberPoints,
  createSupportRequest,
  loadAdminMembers,
  loadAdminSupport,
  loadMemberArea,
  restoreSession,
  sendPasswordReset,
  setMemberStatus,
  signIn,
  signOut,
  signUp,
  updateMemberProfile,
  updateSupportStatus,
  type MemberAccount,
  type MemberProfile,
  type MemberSession,
  type PointsTransaction,
  type SupportRequest,
} from "@/lib/member-area-api";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/members")({
  head: () => ({
    meta: [
      { title: "Members Area — BarangViral.Store" },
      { name: "description", content: "Manage your BarangViral.Store member profile, points, referrals, and support requests." },
    ],
  }),
  component: MembersPage,
});

type MemberAreaData = Awaited<ReturnType<typeof loadMemberArea>>;
type AdminMember = Awaited<ReturnType<typeof loadAdminMembers>>[number];
type Tab = "overview" | "profile" | "referrals" | "points" | "support" | "admin";

const roleLabels: Record<MemberProfile["commerce_role"], string> = {
  buyer: "Buyer",
  seller: "Seller",
  supplier: "Supplier",
  partner: "Viral partner",
};
const statusLabels: Record<SupportRequest["status"], string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};
const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "profile", label: "My profile", icon: BadgeCheck },
  { id: "referrals", label: "Referrals", icon: Gift },
  { id: "points", label: "Points", icon: Wallet },
  { id: "support", label: "Support", icon: Ticket },
];

function MembersPage() {
  const [session, setSession] = useState<MemberSession | null>(null);
  const [area, setArea] = useState<MemberAreaData | null>(null);
  const [adminMembers, setAdminMembers] = useState<AdminMember[]>([]);
  const [adminRequests, setAdminRequests] = useState<SupportRequest[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up" | "reset">("sign-in");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [commerceRole, setCommerceRole] = useState<MemberProfile["commerce_role"]>("buyer");
  const [referralCode, setReferralCode] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileRole, setProfileRole] = useState<MemberProfile["commerce_role"]>("buyer");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [adjustmentMember, setAdjustmentMember] = useState("");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  const isAdmin = session?.user.app_metadata?.role === "admin";
  const isActive = area?.account.account_status === "active";

  const refreshArea = useCallback(async (currentSession: MemberSession) => {
    const next = await loadMemberArea(currentSession);
    setArea(next);
    setProfileName(next.profile.full_name);
    setProfileRole(next.profile.commerce_role);
    return next;
  }, []);

  useEffect(() => {
    let live = true;
    restoreSession()
      .then(async (restored) => {
        if (!live) return;
        setSession(restored);
        if (restored) {
          const next = await loadMemberArea(restored);
          if (!live) return;
          setArea(next);
          setProfileName(next.profile.full_name);
          setProfileRole(next.profile.commerce_role);
        }
      })
      .catch((cause) => {
        if (live) setError(cause instanceof Error ? cause.message : "Could not load your account.");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (tab !== "admin" || !session || !isAdmin) return;
    let live = true;
    setBusy(true);
    Promise.all([loadAdminMembers(session), loadAdminSupport(session)])
      .then(([members, requests]) => {
        if (!live) return;
        setAdminMembers(members);
        setAdminRequests(requests);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load admin data."))
      .finally(() => { if (live) setBusy(false); });
    return () => { live = false; };
  }, [tab, session, isAdmin]);

  const filteredMembers = useMemo(() => {
    const needle = memberSearch.trim().toLowerCase();
    if (!needle) return adminMembers;
    return adminMembers.filter((member) =>
      [member.full_name, member.email, member.referral_code].some((value) => value.toLowerCase().includes(needle)),
    );
  }, [adminMembers, memberSearch]);

  async function handleAuth(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      if (authMode === "reset") {
        await sendPasswordReset(authEmail);
        setMessage("If an account exists for that email, a password reset link is on its way.");
        return;
      }
      if (authMode === "sign-up") {
        if (authPassword.length < 8) throw new Error("Use a password with at least 8 characters.");
        const result = await signUp({
          email: authEmail,
          password: authPassword,
          fullName,
          commerceRole,
          referralCode,
        });
        if (!result.session) {
          setMessage("Account created. Check your email to confirm the address, then sign in.");
          setAuthMode("sign-in");
          return;
        }
        setSession(result.session);
        await refreshArea(result.session);
        setMessage("Your member account is ready.");
      } else {
        const next = await signIn(authEmail, authPassword);
        setSession(next);
        await refreshArea(next);
        setMessage("");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't complete that request.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    if (!session) return;
    setBusy(true);
    try {
      await signOut(session);
      setSession(null);
      setArea(null);
      setTab("overview");
      setMessage("");
      setError("");
    } finally {
      setBusy(false);
    }
  }

  async function handleProfileSave(event: FormEvent) {
    event.preventDefault();
    if (!session || !area) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await updateMemberProfile(session, { full_name: profileName.trim(), commerce_role: profileRole });
      await refreshArea(session);
      setMessage("Profile updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Profile update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSupportSubmit(event: FormEvent) {
    event.preventDefault();
    if (!session) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await createSupportRequest(session, supportSubject, supportMessage);
      setSupportSubject("");
      setSupportMessage("");
      await refreshArea(session);
      setMessage("Support request sent.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Support request could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePointAdjustment(event: FormEvent) {
    event.preventDefault();
    if (!session || !adjustmentMember) return;
    const amount = Number(adjustmentAmount);
    if (!Number.isSafeInteger(amount) || amount === 0) {
      setError("Enter a non-zero whole number of points.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await adjustMemberPoints(session, adjustmentMember, amount, adjustmentReason);
      setAdjustmentAmount("");
      setAdjustmentReason("");
      const refreshed = await loadAdminMembers(session);
      setAdminMembers(refreshed);
      if (session.user.id === adjustmentMember) await refreshArea(session);
      setMessage("Points adjusted and recorded.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Point adjustment failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleStatusChange(memberId: string, status: MemberAccount["account_status"]) {
    if (!session) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await setMemberStatus(session, memberId, status);
      setAdminMembers((current) =>
        current.map((member) => member.id === memberId && member.account
          ? { ...member, account: { ...member.account, account_status: status } }
          : member),
      );
      setMessage(status === "suspended" ? "Member account suspended." : "Member account reactivated.");
      if (memberId === session.user.id) await refreshArea(session);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Account status could not be changed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSupportStatus(request: SupportRequest, status: SupportRequest["status"]) {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      await updateSupportStatus(session, request.id, status);
      setAdminRequests((current) => current.map((item) => item.id === request.id ? { ...item, status } : item));
      setMessage("Support request status updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Support status could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  async function copyReferralCode() {
    if (!area) return;
    try {
      await navigator.clipboard.writeText(area.profile.referral_code);
      setMessage("Referral code copied.");
    } catch {
      setMessage(`Your referral code is ${area.profile.referral_code}`);
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading your member area…
    </div>;
  }

  if (!session || !area) {
    return (
      <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
        <div className="mx-auto max-w-5xl">
          <a href="/" className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to BarangViral.Store
          </a>
          <div className="grid overflow-hidden rounded-3xl border border-border bg-card shadow-xl md:grid-cols-[1.05fr_.95fr]">
            <section className="hidden flex-col justify-between bg-foreground p-10 text-background md:flex">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-background/20 px-3 py-1 text-xs font-semibold tracking-wide">
                  <Sparkles className="h-4 w-4 text-primary" /> BARANGVIRAL MEMBERS
                </span>
                <h1 className="mt-10 max-w-md text-4xl font-semibold leading-tight">One place for your commerce journey.</h1>
                <p className="mt-4 max-w-md text-sm leading-7 text-background/70">
                  Keep your member profile, referrals, points, and support requests together.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-2xl border border-background/15 p-4"><Gift className="mb-3 h-5 w-5 text-primary" />Referral code</div>
                <div className="rounded-2xl border border-background/15 p-4"><Wallet className="mb-3 h-5 w-5 text-primary" />Points history</div>
                <div className="rounded-2xl border border-background/15 p-4"><Ticket className="mb-3 h-5 w-5 text-primary" />Member support</div>
              </div>
            </section>
            <section className="p-6 sm:p-10">
              <a href="/" className="mb-8 block md:hidden"><img src="/BarangViral%20Speed%20Shopping%20Logo.png" alt="BarangViral.Store" className="h-10 w-auto object-contain" /></a>
              <div className="mb-7">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Members Area</p>
                <h2 className="mt-2 text-3xl font-semibold">{authMode === "sign-up" ? "Create your account" : authMode === "reset" ? "Reset password" : "Welcome back"}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {authMode === "sign-up" ? "Join BarangViral.Store and get your own member dashboard." : authMode === "reset" ? "We'll email you a secure password reset link." : "Sign in to access your member dashboard."}
                </p>
              </div>
              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === "sign-up" && <>
                  <Field label="Full name"><input required maxLength={120} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" className={inputClass} /></Field>
                  <Field label="I am joining as">
                    <select value={commerceRole} onChange={(e) => setCommerceRole(e.target.value as MemberProfile["commerce_role"])} className={inputClass}>
                      {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </Field>
                  <Field label="Referral code (optional)"><input value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} maxLength={24} placeholder="BV-XXXXXXXXXX" className={inputClass} /></Field>
                </>}
                <Field label="Email address"><input required type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} autoComplete="email" className={inputClass} /></Field>
                {authMode !== "reset" && <Field label="Password"><input required type="password" minLength={authMode === "sign-up" ? 8 : 1} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} autoComplete={authMode === "sign-up" ? "new-password" : "current-password"} className={inputClass} /></Field>}
                {error && <Notice variant="error">{error}</Notice>}
                {message && <Notice variant="success">{message}</Notice>}
                <Button type="submit" variant="commerce" className="h-12 w-full" disabled={busy}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {authMode === "sign-up" ? "Create member account" : authMode === "reset" ? "Send reset link" : "Sign in"}
                  {!busy && <ArrowRight className="ml-auto h-4 w-4" />}
                </Button>
              </form>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
                {authMode === "sign-in"
                  ? <><button className="text-muted-foreground hover:text-foreground" onClick={() => { setError(""); setMessage(""); setAuthMode("reset"); }}>Forgot password?</button><button className="font-semibold text-primary hover:underline" onClick={() => { setError(""); setMessage(""); setAuthMode("sign-up"); }}>Create account</button></>
                  : <button className="font-semibold text-primary hover:underline" onClick={() => { setError(""); setMessage(""); setAuthMode("sign-in"); }}>Back to sign in</button>}
              </div>
              <p className="mt-7 text-xs leading-5 text-muted-foreground">Your account data is protected by database access rules. Never share your password or sign-in link.</p>
            </section>
          </div>
        </div>
      </main>
    );
  }

  const adminTabList: typeof tabs = [...tabs, ...(isAdmin ? [{ id: "admin" as const, label: "Admin", icon: ShieldCheck }] : [])];
  const formattedDate = (value: string) => new Date(value).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });

  return (
    <main className="min-h-screen bg-muted/40 text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3"><img src="/BarangViral%20Speed%20Shopping%20Logo.png" alt="BarangViral.Store" className="h-9 w-auto object-contain" /><span className="hidden border-l border-border pl-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:inline">Members Area</span></a>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-48 truncate text-sm text-muted-foreground sm:block">{session.user.email}</span>
            {isAdmin && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Admin</span>}
            <Button variant="outline" size="sm" onClick={handleSignOut} disabled={busy}><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <a href="/" className="mb-4 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />Back to storefront</a>
            <h1 className="text-3xl font-semibold tracking-tight">Hello, {area.profile.full_name || session.user.email.split("@")[0]}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Your BarangViral.Store membership, referrals, and support.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm">
            {isActive ? <span className="h-2 w-2 rounded-full bg-emerald-500" /> : <span className="h-2 w-2 rounded-full bg-destructive" />}
            Account {area.account.account_status}
          </div>
        </div>

        {error && <div className="mb-5"><Notice variant="error">{error}</Notice></div>}
        {message && <div className="mb-5"><Notice variant="success">{message}</Notice></div>}
        {!isActive && <div className="mb-5"><Notice variant="error">Your account is suspended. Editing your profile and opening new support requests are disabled. Contact support if you believe this is a mistake.</Notice></div>}

        <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
          <aside className="h-fit rounded-2xl border border-border bg-background p-2">
            <nav className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1" aria-label="Member navigation">
              {adminTabList.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => { setTab(id); setError(""); setMessage(""); }} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                  <Icon className="h-4 w-4" />{label}
                </button>
              ))}
            </nav>
            <div className="mt-3 hidden border-t border-border px-3 py-4 text-xs leading-5 text-muted-foreground lg:block">
              <ShieldCheck className="mb-2 h-4 w-4 text-primary" />Your data is scoped to your account. Admin actions are checked by Supabase policies.
            </div>
          </aside>
          <section className="min-w-0">
            {tab === "overview" && <Overview area={area} session={session} onOpen={setTab} onCopy={copyReferralCode} />}
            {tab === "profile" && <Panel title="Member profile" subtitle="Keep your account details current.">
              <form onSubmit={handleProfileSave} className="grid gap-4 sm:max-w-xl">
                <Field label="Full name"><input required maxLength={120} disabled={!isActive} value={profileName} onChange={(e) => setProfileName(e.target.value)} className={inputClass} /></Field>
                <Field label="Commerce role"><select disabled={!isActive} value={profileRole} onChange={(e) => setProfileRole(e.target.value as MemberProfile["commerce_role"])} className={inputClass}>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
                <Field label="Email address"><input readOnly value={area.profile.email} className={`${inputClass} opacity-70`} /></Field>
                <Field label="Membership"><input readOnly value="Gold member" className={`${inputClass} opacity-70`} /></Field>
                {isActive && <Button type="submit" variant="commerce" className="mt-2 w-fit" disabled={busy}>Save profile</Button>}
              </form>
            </Panel>}
            {tab === "referrals" && <Panel title="Your referral code" subtitle="Share this code so new members can connect their account to you.">
              <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
                <div className="rounded-2xl bg-foreground p-6 text-background">
                  <Gift className="mb-5 h-6 w-6 text-primary" /><p className="text-xs uppercase tracking-[.18em] text-background/60">Personal referral code</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3"><strong className="text-2xl tracking-wider">{area.profile.referral_code}</strong><Button variant="light" size="sm" onClick={copyReferralCode}><Copy className="mr-2 h-4 w-4" />Copy</Button></div>
                  <p className="mt-4 text-xs leading-5 text-background/60">New members can enter the code when they create an account.</p>
                </div>
                <div className="rounded-2xl border border-border p-6"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Members referred</p><p className="mt-3 text-4xl font-semibold">{area.referrals.length}</p><p className="mt-2 text-sm text-muted-foreground">Referral links are recorded when a new account signs up with your code.</p></div>
              </div>
            </Panel>}
            {tab === "points" && <Panel title="Points" subtitle="See your current balance and every recorded adjustment.">
              <div className="mb-6 flex items-center gap-4 rounded-2xl bg-primary p-6 text-primary-foreground"><Wallet className="h-8 w-8" /><div><p className="text-xs uppercase tracking-wider opacity-80">Available balance</p><p className="text-3xl font-semibold">{area.account.points_balance.toLocaleString()} pts</p></div></div>
              <TransactionList items={area.points} formatDate={formattedDate} />
            </Panel>}
            {tab === "support" && <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
              <Panel title="Contact member support" subtitle="Tell us how we can help.">
                <form onSubmit={handleSupportSubmit} className="space-y-4">
                  <Field label="Subject"><input required minLength={3} maxLength={160} disabled={!isActive} value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} className={inputClass} /></Field>
                  <Field label="Message"><textarea required minLength={10} maxLength={5000} rows={6} disabled={!isActive} value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} className={`${inputClass} resize-y`} /></Field>
                  {isActive && <Button type="submit" variant="commerce" disabled={busy}>Send request <ArrowRight className="ml-2 h-4 w-4" /></Button>}
                </form>
              </Panel>
              <Panel title="Your requests" subtitle="Track updates from the BarangViral.Store team.">
                {area.support.length ? <div className="space-y-3">{area.support.map((request) => <SupportCard key={request.id} request={request} formatDate={formattedDate} />)}</div> : <Empty icon={Ticket} title="No support requests yet" text="Any messages you send will show up here." />}
              </Panel>
            </div>}
            {tab === "admin" && isAdmin && <div className="space-y-5">
              <Panel title="Member administration" subtitle="Manage account status and record auditable point adjustments.">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">{adminMembers.length} member accounts</p>
                  <input aria-label="Search members" placeholder="Search name, email, or referral code" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} className={`${inputClass} w-full sm:max-w-xs`} />
                </div>
                {filteredMembers.length ? <div className="space-y-3">{filteredMembers.map((member) => <AdminMemberCard key={member.id} member={member} busy={busy} onStatus={handleStatusChange} onAdjust={(id) => { setAdjustmentMember(id); setError(""); setMessage(""); }} />)}</div> : <Empty icon={Users} title="No matching members" text="Try a different search." />}
                {adjustmentMember && <form onSubmit={handlePointAdjustment} className="mt-5 grid gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:grid-cols-[1fr_1fr_2fr_auto]">
                  <Field label="Point change"><input type="number" step="1" required value={adjustmentAmount} onChange={(e) => setAdjustmentAmount(e.target.value)} placeholder="e.g. 100 or -50" className={inputClass} /></Field>
                  <Field label="Member"><input readOnly value={adminMembers.find((m) => m.id === adjustmentMember)?.email || ""} className={`${inputClass} opacity-70`} /></Field>
                  <Field label="Reason (required)"><input required minLength={1} maxLength={500} value={adjustmentReason} onChange={(e) => setAdjustmentReason(e.target.value)} placeholder="Reason for this adjustment" className={inputClass} /></Field>
                  <div className="flex items-end"><Button type="submit" variant="commerce" disabled={busy}>Record</Button></div>
                </form>}
              </Panel>
              <Panel title="Support inbox" subtitle="Review member requests and update workflow status.">
                {adminRequests.length ? <div className="space-y-3">{adminRequests.map((request) => <article key={request.id} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{request.subject}</h3><p className="mt-1 text-xs text-muted-foreground">{adminMembers.find((member) => member.id === request.user_id)?.email || request.user_id} · {formattedDate(request.created_at)}</p></div><select aria-label={`Status for ${request.subject}`} value={request.status} disabled={busy} onChange={(e) => handleSupportStatus(request, e.target.value as SupportRequest["status"])} className={`${inputClass} w-auto`}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{request.message}</p>
                </article>)}</div> : <Empty icon={Ticket} title="No support requests" text="Member requests will appear here." />}
              </Panel>
            </div>}
          </section>
        </div>
      </div>
    </main>
  );
}

const inputClass = "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}{children}</label>;
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-background p-5 shadow-sm sm:p-6"><div className="mb-5"><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p></div>{children}</div>;
}

function Notice({ variant, children }: { variant: "error" | "success"; children: React.ReactNode }) {
  return <div role={variant === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${variant === "error" ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-emerald-600/30 bg-emerald-600/5 text-emerald-700"}`}>{children}</div>;
}

function Empty({ icon: Icon, title, text }: { icon: typeof Ticket; title: string; text: string }) {
  return <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center"><Icon className="mx-auto h-7 w-7 text-muted-foreground" /><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{text}</p></div>;
}

function Overview({ area, session, onOpen, onCopy }: { area: MemberAreaData; session: MemberSession; onOpen: (tab: Tab) => void; onCopy: () => void }) {
  const stats = [
    { label: "Points balance", value: area.account.points_balance.toLocaleString(), icon: Wallet, tab: "points" as const },
    { label: "Members referred", value: String(area.referrals.length), icon: Gift, tab: "referrals" as const },
    { label: "Open requests", value: String(area.support.filter((request) => request.status === "open" || request.status === "in_progress").length), icon: Ticket, tab: "support" as const },
  ];
  return <div className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-3">{stats.map(({ label, value, icon: Icon, tab }) => <button key={label} onClick={() => onOpen(tab)} className="rounded-2xl border border-border bg-background p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><span className="mt-5 block text-2xl font-semibold">{value}</span><span className="mt-1 block text-sm text-muted-foreground">{label}</span></button>)}</div>
    <Panel title="Your membership" subtitle="Your member account is ready to use.">
      <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
        <div><div className="flex items-center gap-2"><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">GOLD MEMBER</span><span className="text-xs text-muted-foreground">{roleLabels[area.profile.commerce_role]}</span></div><h3 className="mt-3 text-xl font-semibold">{area.profile.full_name || session.user.email}</h3><p className="mt-1 text-sm text-muted-foreground">{session.user.email}</p></div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => onOpen("profile")}>Edit profile</Button><Button variant="commerce" onClick={() => onOpen("referrals")}>Invite a member <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
      </div>
    </Panel>
    <Panel title="Referral code" subtitle="Share your code with a new BarangViral.Store member.">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-2xl font-semibold tracking-wider">{area.profile.referral_code}</p><p className="mt-1 text-sm text-muted-foreground">Your code is created securely when your account is registered.</p></div><Button variant="outline" onClick={onCopy}><Copy className="mr-2 h-4 w-4" />Copy code</Button></div>
    </Panel>
  </div>;
}

function TransactionList({ items, formatDate }: { items: PointsTransaction[]; formatDate: (value: string) => string }) {
  if (!items.length) return <Empty icon={Wallet} title="No point activity yet" text="Admin adjustments will appear here with their reason and updated balance." />;
  return <div className="divide-y divide-border rounded-2xl border border-border">{items.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"><div><p className="font-medium">{item.reason}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(item.created_at)} · {item.admin_email}</p></div><div className="text-right"><p className={`font-semibold ${item.amount > 0 ? "text-emerald-600" : "text-destructive"}`}>{item.amount > 0 ? "+" : ""}{item.amount} pts</p><p className="text-xs text-muted-foreground">Balance {item.balance_after.toLocaleString()}</p></div></div>)}</div>;
}

function SupportCard({ request, formatDate }: { request: SupportRequest; formatDate: (value: string) => string }) {
  return <article className="rounded-2xl border border-border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{request.subject}</h3><span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{statusLabels[request.status]}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{request.message}</p><p className="mt-3 text-xs text-muted-foreground">Submitted {formatDate(request.created_at)}</p></article>;
}

function AdminMemberCard({ member, busy, onStatus, onAdjust }: { member: AdminMember; busy: boolean; onStatus: (id: string, status: MemberAccount["account_status"]) => void; onAdjust: (id: string) => void }) {
  const account = member.account;
  return <article className="flex flex-col gap-4 rounded-2xl border border-border p-4 xl:flex-row xl:items-center xl:justify-between">
    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{member.full_name || "New member"}</h3><span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">{roleLabels[member.commerce_role]}</span><span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">{account?.account_status || "unknown"}</span></div><p className="mt-1 truncate text-sm text-muted-foreground">{member.email}</p><p className="mt-1 text-xs text-muted-foreground">{member.referral_code} · Gold · {account?.points_balance.toLocaleString() || 0} pts</p></div>
    <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={busy || !account} onClick={() => onStatus(member.id, account?.account_status === "active" ? "suspended" : "active")}>{account?.account_status === "active" ? "Suspend" : "Reactivate"}</Button><Button variant="commerce" size="sm" disabled={busy || !account} onClick={() => onAdjust(member.id)}>Adjust points</Button></div>
  </article>;
}
