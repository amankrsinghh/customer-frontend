import { useState } from "react";
import { signIn, signUp, sendPasswordReset } from "../shared/auth";
import { useHashRoute, Link } from "../shared/router";
import { Button, Input, toast } from "../shared/ui";

export function Login() {
  const { navigate } = useHashRoute();
  const [email, setEmail] = useState("demo@tavishalove.com");
  const [password, setPassword] = useState("demo1234");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (forgot) {
        await sendPasswordReset(email);
        toast("Reset link sent (mock)");
        setForgot(false);
      } else {
        const u = await signIn(email, password);
        toast("Welcome back, " + u.name.split(" ")[0]);
        navigate("/");
      }
    } catch (err) {
      toast((err as Error).message, "err");
    } finally { setBusy(false); }
  }

  return (
    <AuthShell title={forgot ? "Reset password" : "Welcome back"}
      subtitle={forgot ? "We'll email you a reset link." : "Sign in to your Tavishalove account."}>
      <form onSubmit={submit} className="space-y-4">
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {!forgot && (
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        )}
        <Button className="w-full" disabled={busy}>
          {busy ? "Please wait…" : forgot ? "Send reset link" : "Sign In"}
        </Button>
      </form>
      <div className="mt-5 flex justify-between text-sm">
        <button onClick={() => setForgot(!forgot)} className="text-ink/60 hover:text-rose-gold">
          {forgot ? "← Back to sign in" : "Forgot password?"}
        </button>
        <Link to="/signup" className="text-rose-gold-dark hover:underline">Create account</Link>
      </div>
      <div className="mt-6 rounded-lg bg-blush/40 p-3 text-[11px] text-ink/60">
        Demo: <b>demo@tavishalove.com</b> / <b>demo1234</b>
      </div>
    </AuthShell>
  );
}


export function Signup() {
  const { navigate } = useHashRoute();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await signUp(form);
      toast("Account created!");
      navigate("/");
    } catch (err) {
      toast((err as Error).message, "err");
    } finally { setBusy(false); }
  }
  return (
    <AuthShell title="Create your account" subtitle="Join Tavishalove Store for early access to drops & couture.">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Full Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Password" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <Button className="w-full" disabled={busy}>{busy ? "Creating…" : "Create Account"}</Button>
      </form>
      <div className="mt-5 text-center text-sm text-ink/60">
        Already a member? <Link to="/login" className="text-rose-gold-dark hover:underline">Sign in</Link>
      </div>
    </AuthShell>
  );
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-ink/5">
        <div className="text-center">
          <div className="font-serif text-3xl text-ink">{title}</div>
          <p className="mt-2 text-sm text-ink/60">{subtitle}</p>
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
