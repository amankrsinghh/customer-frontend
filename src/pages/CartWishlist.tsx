import { useEffect, useState } from "react";
import { getCart, setCart, getWishlist, setWishlist, productsDB } from "../shared/mockStore";
import { useAuth } from "../shared/auth";
import { Link, useHashRoute } from "../shared/router";
import type { CartItem, Product } from "../shared/types";
import { Button, Empty, formatINR, toast } from "../shared/ui";
import { ProductCard } from "./Home";

export function Cart() {
  const user = useAuth();
  const { navigate } = useHashRoute();
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (!user) return;
    setItems(getCart(user.uid));
  }, [user]);

  if (!user) {
    return <SignInPrompt msg="Sign in to view your cart" />;
  }
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <Empty title="Your cart is empty" subtitle="Discover our latest pieces."
          action={<Button onClick={() => navigate("/shop")}>Browse Collection</Button>} />
      </div>
    );
  }

  function update(i: number, qty: number) {
    const next = [...items];
    if (qty <= 0) next.splice(i, 1);
    else next[i] = { ...next[i], quantity: qty };
    setItems(next);
    setCart(user!.uid, next);
  }


  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal >= 5000 ? 0 : 199;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <h1 className="font-serif text-4xl">Your Cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map((it, i) => (
            <div key={i} className="flex gap-4 rounded-2xl bg-white p-4 ring-1 ring-ink/5">
              <img src={it.image} alt={it.title} className="h-28 w-24 rounded-lg object-cover" />
              <div className="flex-1">
                <div className="flex justify-between gap-2">
                  <div>
                    <div className="font-serif text-lg">{it.title}</div>
                    <div className="mt-0.5 text-xs text-ink/60">Size: {it.size} · Color: {it.color}</div>
                  </div>
                  <button onClick={() => update(i, 0)} className="text-xs text-ink/50 hover:text-rose-700">Remove</button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="inline-flex items-center rounded-full border border-ink/15">
                    <button onClick={() => update(i, it.quantity - 1)} className="px-3 py-1">−</button>
                    <span className="w-8 text-center text-sm">{it.quantity}</span>
                    <button onClick={() => update(i, it.quantity + 1)} className="px-3 py-1">+</button>
                  </div>
                  <div className="font-serif text-lg text-rose-gold-dark">
                    {formatINR(it.price * it.quantity)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <aside className="rounded-2xl bg-white p-6 ring-1 ring-ink/5 lg:sticky lg:top-28 lg:self-start">
          <div className="font-serif text-2xl">Order Summary</div>
          <div className="mt-5 space-y-2 text-sm">
            <Row k="Subtotal" v={formatINR(subtotal)} />
            <Row k="Shipping" v={shipping === 0 ? "Free" : formatINR(shipping)} />
            <div className="my-3 h-px bg-ink/10" />
            <Row k="Total" v={formatINR(subtotal + shipping)} bold />
          </div>
          <Button className="mt-6 w-full" onClick={() => navigate("/checkout")}>Proceed to Checkout</Button>
          <Link to="/shop" className="mt-3 block text-center text-xs text-ink/60 hover:text-rose-gold">
            Continue shopping
          </Link>
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

export function Wishlist() {
  const user = useAuth();
  const { navigate } = useHashRoute();
  const [ids, setIds] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    if (!user) return;
    setIds(getWishlist(user.uid));
    return productsDB.subscribe(setProducts);
  }, [user]);

  if (!user) return <SignInPrompt msg="Sign in to view your wishlist" />;
  const items = products.filter((p) => ids.includes(p.id));

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <Empty title="Your wishlist is empty" subtitle="Save your favourites for later."
          action={<Button onClick={() => navigate("/shop")}>Browse Collection</Button>} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-4xl">Wishlist</h1>
        <button
          onClick={() => { setWishlist(user.uid, []); setIds([]); toast("Wishlist cleared"); }}
          className="text-xs text-ink/50 hover:text-rose-700"
        >
          Clear all
        </button>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}

function SignInPrompt({ msg }: { msg: string }) {
  const { navigate } = useHashRoute();
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h2 className="font-serif text-3xl">{msg}</h2>
      <p className="mt-2 text-sm text-ink/60">It only takes a moment.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={() => navigate("/login")}>Sign In</Button>
        <Button variant="outline" onClick={() => navigate("/signup")}>Create Account</Button>
      </div>
    </div>
  );
}
