import { useEffect, useMemo, useState } from "react";
import { getCart, setCart, placeOrder, uid as makeId } from "../shared/mockStore";
import { useAuth } from "../shared/auth";
import { useHashRoute } from "../shared/router";
import { Button, Input, Textarea, formatINR, toast } from "../shared/ui";
import type { Order, CartItem } from "../shared/types";
import { openRazorpayCheckout } from "../shared/razorpay";
import { sendOrderConfirmationEmail } from "../shared/email";
import { pushOrderToSheet } from "../shared/googleSheets";

export function Checkout() {
  const user = useAuth();
  const { navigate } = useHashRoute();
  const [items, setItems] = useState<CartItem[]>([]);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    address: user?.address || "",
  });
  const [method, setMethod] = useState<"COD" | "Razorpay">("COD");
  const [busy, setBusy] = useState(false);

  // Success Animation states
  const [showSuccess, setShowSuccess] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState("");

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    setItems(getCart(user.uid));
  }, [user]);

  // Sync profile details if they load late
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
        address: user.address || "",
      });
    }
  }, [user]);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);
  const shipping = subtotal >= 5000 ? 0 : 199;
  const total = subtotal + shipping;

  if (!user) return null;

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-cream/95 backdrop-blur-md fade-in">
        <style>{`
          @keyframes checkmark {
            0% { stroke-dashoffset: 50; }
            100% { stroke-dashoffset: 0; }
          }
          .animate-checkmark {
            stroke-dasharray: 50;
            stroke-dashoffset: 50;
            animation: checkmark 0.6s cubic-bezier(0.65, 0, 0.45, 1) 0.2s forwards;
          }
          .animate-ping-once {
            animation: ping-once 1.2s cubic-bezier(0, 0, 0.2, 1) 1;
          }
          @keyframes ping-once {
            75%, 100% { transform: scale(1.6); opacity: 0; }
          }
          .scale-in {
            animation: scale-in-anim 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
          @keyframes scale-in-anim {
            0% { transform: scale(0.9); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>

        <div className="max-w-md px-6 text-center scale-in">
          {/* Sparkles / Checkmark Animation Container */}
          <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-rose-gold/10 text-rose-gold">
            <svg className="h-12 w-12 stroke-rose-gold animate-checkmark" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <div className="absolute inset-0 rounded-full border-4 border-rose-gold/30 animate-ping-once" />
          </div>

          <h2 className="mt-8 font-serif text-3xl text-ink">Order Placed Successfully!</h2>
          <p className="mt-2 text-xs text-rose-gold-dark font-semibold uppercase tracking-[0.2em]">Thank you for your order</p>
          
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/5 text-left">
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-ink/40">Order Reference</div>
              <div className="mt-1 font-serif text-2xl text-rose-gold-dark font-semibold">{successOrderId}</div>
            </div>
            
            <p className="mt-4 border-t border-ink/5 pt-4 text-xs leading-relaxed text-ink/60 text-center">
              A detailed confirmation invoice has been sent to your email <b className="text-ink">{form.email}</b>.
              Our atelier designers will reach out on WhatsApp shortly to verify your custom tailoring specifications.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <Button onClick={() => { setShowSuccess(false); navigate("/orders"); }}>
              Track My Orders
            </Button>
            <button onClick={() => { setShowSuccess(false); navigate("/shop"); }} className="text-sm font-medium text-rose-gold hover:underline">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h2 className="font-serif text-3xl">Your cart is empty</h2>
        <div className="mt-6"><Button onClick={() => navigate("/shop")}>Browse Collection</Button></div>
      </div>
    );
  }

  async function submit() {
    if (!form.name || !form.phone || !form.address) {
      toast("Please fill all delivery details", "err"); return;
    }
    setBusy(true);
    const order: Order = {
      id: "CCD-" + makeId(),
      userId: user!.uid,
      customerName: form.name,
      phone: form.phone,
      email: form.email,
      address: form.address,
      items,
      subtotal, shipping, total,
      paymentStatus: method === "COD" ? "Pending" : "Pending",
      orderStatus: "Pending",
      paymentMethod: method,
      createdAt: Date.now(),
    };

    if (method === "Razorpay") {
      await openRazorpayCheckout({
        amount: total, orderId: order.id,
        customerName: form.name, email: form.email, phone: form.phone,
        onSuccess: async () => {
          order.paymentStatus = "Paid";
          try {
            await placeOrder(order);
            // Synchronously await BOTH Google Sheets upload and customer email confirmation!
            await Promise.all([
              pushOrderToSheet(order),
              sendOrderConfirmationEmail(order)
            ]);
          } catch (err) {
            console.error("[Checkout] Sync failed:", err);
          }
          
          setCart(user!.uid, []);
          setSuccessOrderId(order.id);
          setShowSuccess(true);
          setBusy(false);
        },
        onFailure: () => { toast("Payment failed, try again", "err"); setBusy(false); },
      });
    } else {
      try {
        await placeOrder(order);
        // Synchronously await BOTH Google Sheets upload and customer email confirmation!
        await Promise.all([
          pushOrderToSheet(order),
          sendOrderConfirmationEmail(order)
        ]);
      } catch (err) {
        console.error("[Checkout] Sync failed:", err);
      }
      
      setCart(user!.uid, []);
      setSuccessOrderId(order.id);
      setShowSuccess(true);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <h1 className="font-serif text-4xl">Checkout</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl bg-white p-6 ring-1 ring-ink/5">
            <div className="font-serif text-2xl">Delivery Details</div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Input label="Full Name" value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })} />
              <Input label="Phone" value={form.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, phone: e.target.value })} />
              <Input label="Email" value={form.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: e.target.value })} className="md:col-span-2" />
              <div className="md:col-span-2">
                <Textarea rows={3} label="Complete Address" value={form.address} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, address: e.target.value })} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 ring-1 ring-ink/5">
            <div className="font-serif text-2xl">Payment Method</div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(["COD", "Razorpay"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={"rounded-xl border p-4 text-left transition " +
                    (method === m ? "border-rose-gold bg-blush/40" : "border-ink/15 hover:border-rose-gold")}
                >
                  <div className="font-medium">{m === "COD" ? "Cash on Delivery" : "Razorpay (UPI / Card)"}</div>
                  <div className="mt-1 text-xs text-ink/60">
                    {m === "COD"
                      ? "Pay when your order arrives."
                      : "Secure online payment. (Mock mode — keys placeholder)"}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="rounded-2xl bg-white p-6 ring-1 ring-ink/5 lg:sticky lg:top-28 lg:self-start">
          <div className="font-serif text-2xl">Summary</div>
          <div className="mt-4 space-y-3">
            {items.map((it, i) => (
              <div key={i} className="flex gap-3">
                <img src={it.image} className="h-14 w-12 rounded-md object-cover" />
                <div className="flex-1 text-sm">
                  <div className="line-clamp-1">{it.title}</div>
                  <div className="text-xs text-ink/50">{it.size} · {it.color} · ×{it.quantity}</div>
                </div>
                <div className="text-sm">{formatINR(it.price * it.quantity)}</div>
              </div>
            ))}
          </div>
          <div className="my-4 h-px bg-ink/10" />
          <div className="space-y-2 text-sm">
            <Row k="Subtotal" v={formatINR(subtotal)} />
            <Row k="Shipping" v={shipping === 0 ? "Free" : formatINR(shipping)} />
            <div className="my-2 h-px bg-ink/10" />
            <Row k="Total" v={formatINR(total)} bold />
          </div>
          <Button className="mt-5 w-full" onClick={submit} disabled={busy}>
            {busy ? "Placing order…" : `Place Order · ${formatINR(total)}`}
          </Button>
          <p className="mt-3 text-center text-[11px] text-ink/50">
            Orders sync to Google Sheets automatically.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={"flex justify-between " + (bold ? "text-base font-semibold" : "text-ink/70")}>
      <span>{k}</span><span>{v}</span>
    </div>
  );
}
