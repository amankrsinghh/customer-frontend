import { useEffect, useState } from "react";
import { ordersDB, settingsDB } from "../shared/mockStore";
import { useAuth } from "../shared/auth";
import { useHashRoute } from "../shared/router";
import type { Order } from "../shared/types";
import { Badge, Button, Empty, formatINR, toast } from "../shared/ui";

const STATUS_TONE: Record<string, "rose" | "ink" | "green" | "amber" | "red"> = {
  Pending: "amber", Confirmed: "rose", "In Production": "rose",
  Shipped: "ink", Delivered: "green", Cancelled: "red",
  "Return Requested": "amber", Returned: "red",
};

export function MyOrders() {
  const user = useAuth();
  const { navigate } = useHashRoute();
  const [orders, setOrders] = useState<Order[]>([]);
  const [returnDays, setReturnDays] = useState(7);

  useEffect(() => {
    if (!user) return;
    return ordersDB.subscribe((all) =>
      setOrders(all.filter((o) => o.userId === user.uid)));
  }, [user]);

  useEffect(() => {
    return settingsDB.subscribe((all) => {
      const storeSettings = all.find((s) => s.id === "store_settings");
      if (storeSettings && storeSettings.returnWindowDays !== undefined) {
        setReturnDays(Number(storeSettings.returnWindowDays));
      }
    });
  }, []);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h2 className="font-serif text-3xl">Sign in to see your orders</h2>
        <div className="mt-6"><Button onClick={() => navigate("/login")}>Sign In</Button></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <Empty title="No orders yet" subtitle="Start your couture journey today."
          action={<Button onClick={() => navigate("/shop")}>Shop Now</Button>} />
      </div>
    );
  }

  function cancel(id: string) {
    if (!confirm("Cancel this order? This cannot be undone.")) return;
    ordersDB.update(id, { orderStatus: "Cancelled" });
    toast("Order cancelled");
  }

  function requestReturn(id: string) {
    if (!confirm("Are you sure you want to request a return for this order?")) return;
    ordersDB.update(id, { orderStatus: "Return Requested" });
    toast("Return request submitted successfully");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <h1 className="font-serif text-4xl">My Orders</h1>
      <div className="mt-8 space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="rounded-2xl bg-white p-6 ring-1 ring-ink/5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-ink/50">Order #{o.id}</div>
                <div className="mt-1 font-serif text-lg">{new Date(o.createdAt).toLocaleString()}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone={STATUS_TONE[o.orderStatus]}>{o.orderStatus}</Badge>
                  <Badge tone={o.paymentStatus === "Paid" ? "green" : "amber"}>{o.paymentStatus}</Badge>
                  <Badge tone="ink">{o.paymentMethod}</Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="font-serif text-2xl text-rose-gold-dark">{formatINR(o.total)}</div>
                {(o.orderStatus === "Pending" || o.orderStatus === "Confirmed" || o.orderStatus === "In Production") && (
                  <button onClick={() => cancel(o.id)} className="mt-2 text-xs text-rose-700 hover:underline">
                    Cancel order
                  </button>
                )}
                {o.orderStatus === "Delivered" && (() => {
                  const deliveredTime = o.deliveredAt || o.createdAt;
                  const diffTime = Date.now() - deliveredTime;
                  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                  const isWithinWindow = diffDays <= returnDays;
                  
                  if (isWithinWindow) {
                    return (
                      <button onClick={() => requestReturn(o.id)} className="mt-2 block w-full rounded-full border border-rose-gold px-4 py-1 text-xs font-semibold text-rose-gold hover:bg-rose-gold hover:text-white transition">
                        Return Order
                      </button>
                    );
                  } else {
                    return (
                      <span className="mt-2 block text-xs text-ink/40 font-medium italic">
                        Return period expired ({returnDays} days)
                      </span>
                    );
                  }
                })()}
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {o.items.map((it, i) => (
                <div key={i} className="flex gap-3 rounded-lg bg-cream p-3">
                  <img src={it.image} className="h-16 w-14 rounded-md object-cover" />
                  <div className="flex-1 text-sm">
                    <div className="line-clamp-1 font-medium">{it.title}</div>
                    <div className="text-xs text-ink/60">Size: {it.size} · Color: {it.color}</div>
                    <div className="text-xs text-ink/60">Qty: {it.quantity}</div>
                  </div>
                </div>
              ))}
            </div>
            <TrackBar status={o.orderStatus} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TrackBar({ status }: { status: Order["orderStatus"] }) {
  const steps = ["Pending", "Confirmed", "In Production", "Shipped", "Delivered"];
  if (status === "Cancelled") {
    return <div className="mt-5 rounded-lg bg-rose-50 p-3 text-center text-sm text-rose-700">Order cancelled</div>;
  }
  if (status === "Return Requested") {
    return <div className="mt-5 rounded-lg bg-amber-50 p-3 text-center text-sm text-amber-700 font-medium">Return Requested (Awaiting Admin Review)</div>;
  }
  if (status === "Returned") {
    return <div className="mt-5 rounded-lg bg-rose-50 p-3 text-center text-sm text-rose-700 font-medium">Returned & Refunded</div>;
  }
  const idx = steps.indexOf(status);
  
  return (
    <div className="mt-6 border-t border-ink/5 pt-5">
      {/* Mobile View: Vertical Timeline */}
      <div className="md:hidden space-y-4">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div className="relative flex flex-col items-center">
              <div className={"flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold z-10 " +
                (i <= idx ? "bg-rose-gold text-white" : "bg-ink/10 text-ink/40")}>
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={"absolute top-6 w-0.5 h-4 " + (i < idx ? "bg-rose-gold" : "bg-ink/10")} />
              )}
            </div>
            <div>
              <span className={"text-xs uppercase tracking-wider font-medium " + (i <= idx ? "text-rose-gold-dark" : "text-ink/40")}>
                {s}
              </span>
              {i === idx && (
                <span className="ml-2 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-emerald-700 animate-pulse">
                  Active
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View: Horizontal Progress Bar */}
      <div className="hidden md:block">
        <div className="flex items-center">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center">
              <div className={"flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold " +
                (i <= idx ? "bg-rose-gold text-white" : "bg-ink/10 text-ink/40")}>
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={"mx-2 h-0.5 flex-1 " + (i < idx ? "bg-rose-gold" : "bg-ink/10")} />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-ink/60">
          {steps.map((s) => <span key={s} className="flex-1 text-center">{s}</span>)}
        </div>
      </div>
    </div>
  );
}
