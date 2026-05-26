import { useState } from "react";
import { useAuth } from "../shared/auth";
import { customRequestsDB, uid as makeId } from "../shared/mockStore";
import { useHashRoute } from "../shared/router";
import { Button, Input, Select, Textarea, toast } from "../shared/ui";

export function CustomRequest() {
  const user = useAuth();
  const { navigate } = useHashRoute();
  const [form, setForm] = useState({
    inspirationImageUrl: "",
    description: "",
    budget: "₹10,000 - ₹25,000",
    occasion: "Wedding",
    bust: "", waist: "", hips: "", height: "", notes: "",
  });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { toast("Please sign in first", "err"); navigate("/login"); return; }
    setBusy(true);
    customRequestsDB.add({
      id: "REQ-" + makeId(),
      userId: user.uid,
      customerName: user.name,
      phone: user.phone || "",
      email: user.email,
      inspirationImageUrl: form.inspirationImageUrl,
      description: form.description,
      budget: form.budget,
      occasion: form.occasion,
      measurements: {
        bust: form.bust, waist: form.waist, hips: form.hips, height: form.height, notes: form.notes,
      },
      status: "New",
      createdAt: Date.now(),
    });
    toast("Custom request submitted! We'll respond within 24 hours.");
    setBusy(false);
    setForm({ ...form, inspirationImageUrl: "", description: "" });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <div className="text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-rose-gold-dark">Bespoke</div>
        <h1 className="mt-2 font-serif text-4xl lg:text-5xl">Design Your Dream Dress</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-ink/70">
          Share your inspiration, measurements and budget. Our designers will craft a one-of-a-kind piece for you.
        </p>
      </div>

      <form onSubmit={submit} className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl bg-white p-6 ring-1 ring-ink/5">
            <div className="font-serif text-xl">Inspiration & Vision</div>
            <div className="mt-4 space-y-4">
              <Input
                label="Inspiration Image URL"
                placeholder="https://… (Pinterest, Instagram or any image link)"
                value={form.inspirationImageUrl}
                onChange={(e) => setForm({ ...form, inspirationImageUrl: e.target.value })}
              />
              {form.inspirationImageUrl && (
                <img src={form.inspirationImageUrl} alt="" className="max-h-64 rounded-lg object-cover" />
              )}
              <Textarea
                label="Describe your dream dress"
                rows={4}
                placeholder="Eg: A pastel mint Anarkali with floral embroidery, fitted bodice, flared bottom, light dupatta…"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Select label="Occasion"
                  value={form.occasion}
                  onChange={(e) => setForm({ ...form, occasion: e.target.value })}>
                  {["Wedding", "Engagement", "Reception", "Festive", "Cocktail", "Sangeet", "Mehendi", "Casual"]
                    .map((o) => <option key={o}>{o}</option>)}
                </Select>
                <Select label="Budget"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}>
                  {["Under ₹10,000", "₹10,000 - ₹25,000", "₹25,000 - ₹50,000", "₹50,000 - ₹1,00,000", "Above ₹1,00,000"]
                    .map((b) => <option key={b}>{b}</option>)}
                </Select>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 ring-1 ring-ink/5">
            <div className="font-serif text-xl">Measurements <span className="text-xs text-ink/50">(optional — we can also measure during fitting)</span></div>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <Input label="Bust (in)" value={form.bust} onChange={(e) => setForm({ ...form, bust: e.target.value })} />
              <Input label="Waist (in)" value={form.waist} onChange={(e) => setForm({ ...form, waist: e.target.value })} />
              <Input label="Hips (in)" value={form.hips} onChange={(e) => setForm({ ...form, hips: e.target.value })} />
              <Input label="Height (in)" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
              <div className="md:col-span-4">
                <Textarea rows={2} label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
          </section>
        </div>

        <aside className="rounded-2xl bg-ink p-6 text-white lg:sticky lg:top-28 lg:self-start">
          <div className="font-serif text-2xl">How it works</div>
          <ol className="mt-5 space-y-4 text-sm text-white/80">
            <Step n="1" t="Submit your vision" d="Tell us everything — even the smallest details matter." />
            <Step n="2" t="Designer consultation" d="Within 24 hours we'll WhatsApp you with a sketch + quote." />
            <Step n="3" t="Crafted with love" d="Your piece is tailored & hand-finished in 7–14 days." />
            <Step n="4" t="Delivered to you" d="Free fitting consultation included." />
          </ol>
          <Button className="mt-7 w-full" type="submit" disabled={busy}>
            {busy ? "Submitting…" : "Submit Request"}
          </Button>
        </aside>
      </form>
    </div>
  );
}

function Step({ n, t, d }: { n: string; t: string; d: string }) {
  return (
    <li className="flex gap-3">
      <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-rose-gold font-serif">
        {n}
      </div>
      <div>
        <div className="font-medium text-white">{t}</div>
        <div className="text-xs text-white/60">{d}</div>
      </div>
    </li>
  );
}

export function Contact() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <div className="text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-rose-gold-dark">Reach Us</div>
        <h1 className="mt-2 font-serif text-4xl lg:text-5xl">We'd love to hear from you</h1>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 ring-1 ring-ink/5">
          <div className="text-3xl">📞</div>
          <div className="mt-3 font-serif text-xl">Call</div>
          <div className="mt-1 text-sm text-ink/70">+91 98765 43210</div>
          <div className="text-xs text-ink/50">Mon–Sat, 10am–8pm</div>
        </div>
        <div className="rounded-2xl bg-white p-6 ring-1 ring-ink/5">
          <div className="text-3xl">✉️</div>
          <div className="mt-3 font-serif text-xl">Email</div>
          <div className="mt-1 text-sm text-ink/70">hello@tavishalove.com</div>
          <div className="text-xs text-ink/50">We reply within 24 hours</div>
        </div>
        <div className="rounded-2xl bg-white p-6 ring-1 ring-ink/5">
          <div className="text-3xl">📍</div>
          <div className="mt-3 font-serif text-xl">Studio</div>
          <div className="mt-1 text-sm text-ink/70">Tavishalove Atelier, Hauz Khas, New Delhi</div>
          <div className="text-xs text-ink/50">By appointment</div>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); toast("Message sent! We'll reach out soon."); }}
        className="mt-10 rounded-2xl bg-white p-8 ring-1 ring-ink/5">
        <div className="font-serif text-2xl">Send us a message</div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Input label="Name" required />
          <Input label="Email" type="email" required />
          <div className="md:col-span-2">
            <Textarea label="Message" rows={5} required />
          </div>
        </div>
        <div className="mt-5"><Button>Send Message</Button></div>
      </form>
    </div>
  );
}
