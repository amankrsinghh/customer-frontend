import { useState } from "react";
import { useAuth, signOut } from "../shared/auth";
import { usersDB } from "../shared/mockStore";
import { useHashRoute, Link } from "../shared/router";
import { Button, Input, Textarea, toast } from "../shared/ui";

export function Profile() {
  const user = useAuth();
  const { navigate } = useHashRoute();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h2 className="font-serif text-3xl">Sign in to view your profile</h2>
        <div className="mt-6"><Button onClick={() => navigate("/login")}>Sign In</Button></div>
      </div>
    );
  }

  function save() {
    usersDB.update(user!.uid, form);
    window.dispatchEvent(new Event("ccd:auth"));
    toast("Profile updated");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
      <h1 className="font-serif text-4xl">My Profile</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <aside className="space-y-3">
          <div className="rounded-2xl bg-white p-6 ring-1 ring-ink/5">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-gold to-rose-gold-light text-3xl font-serif text-white">
              {user.name.charAt(0)}
            </div>
            <div className="mt-4 text-center">
              <div className="font-serif text-xl">{user.name}</div>
              <div className="text-xs text-ink/60">{user.email}</div>
            </div>
          </div>
          <nav className="rounded-2xl bg-white p-3 ring-1 ring-ink/5 text-sm">
            <Link to="/orders" className="block rounded-lg px-3 py-2 hover:bg-blush/40">My Orders</Link>
            <Link to="/wishlist" className="block rounded-lg px-3 py-2 hover:bg-blush/40">Wishlist</Link>
            <Link to="/custom" className="block rounded-lg px-3 py-2 hover:bg-blush/40">Custom Requests</Link>
            <button
              onClick={() => { signOut(); navigate("/"); toast("Signed out"); }}
              className="block w-full rounded-lg px-3 py-2 text-left text-rose-700 hover:bg-rose-50">
              Sign out
            </button>
          </nav>
        </aside>
        <section className="md:col-span-2 rounded-2xl bg-white p-6 ring-1 ring-ink/5">
          <div className="font-serif text-2xl">Personal Information</div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Email" value={user.email} disabled className="bg-ink/5" />
            <div className="md:col-span-2">
              <Textarea rows={3} label="Default Shipping Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <div className="mt-6"><Button onClick={save}>Save Changes</Button></div>
        </section>
      </div>
    </div>
  );
}
