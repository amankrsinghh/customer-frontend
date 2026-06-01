import { useEffect, useState } from "react";
import { productsDB, getCart, setCart, getWishlist, setWishlist } from "../shared/mockStore";
import { useAuth } from "../shared/auth";
import { Link, useHashRoute } from "../shared/router";
import type { Product } from "../shared/types";
import { Button, Badge, formatINR, toast } from "../shared/ui";

export function ProductDetail({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | undefined>(productsDB.get(id));
  const [imgIdx, setImgIdx] = useState(0);
  const [size, setSize] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const [qty, setQty] = useState(1);
  const user = useAuth();
  const { navigate } = useHashRoute();

  useEffect(() => {
    const unsub = productsDB.subscribe(() => setProduct(productsDB.get(id)));
    return unsub;
  }, [id]);

  useEffect(() => {
    if (product) {
      setSize(product.sizes[0] ?? "");
      setColor(product.colors[0] ?? "");
    }
  }, [product?.id]);

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-32 text-center">
        <h2 className="font-serif text-3xl">Piece not found</h2>
        <p className="mt-3 text-ink/60">It may have been removed.</p>
        <div className="mt-6"><Link to="/shop" className="text-rose-gold">← Back to shop</Link></div>
      </div>
    );
  }

  const price = product.discountPrice ?? product.price;
  const hasDiscount = !!product.discountPrice && product.discountPrice < product.price;
  const wishlist = user ? getWishlist(user.uid) : [];
  const isWished = wishlist.includes(product.id);

  function requireAuth() {
    if (!user) { toast("Please sign in to continue", "err"); navigate("/login"); return false; }
    return true;
  }

  function addToCart() {
    if (!requireAuth() || !user) return;
    const cart = getCart(user.uid);
    const existing = cart.find((c) => c.productId === product!.id && c.size === size && c.color === color);
    if (existing) existing.quantity += qty;
    else cart.push({
      productId: product!.id,
      title: product!.title,
      image: product!.images[0] ?? "",
      price,
      quantity: qty,
      size, color,
    });
    setCart(user.uid, cart);
    toast("Added to cart");
  }

  function buyNow() {
    addToCart();
    if (user) navigate("/checkout");
  }

  function toggleWish() {
    if (!requireAuth() || !user) return;
    const list = getWishlist(user.uid);
    const next = list.includes(product!.id) ? list.filter((x) => x !== product!.id) : [...list, product!.id];
    setWishlist(user.uid, next);
    toast(next.includes(product!.id) ? "Saved to wishlist" : "Removed from wishlist");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <Link to="/shop" className="text-sm text-ink/60 hover:text-rose-gold">← Back to shop</Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-blush">
            <img src={product.images[imgIdx]} alt={product.title} className="h-full w-full object-cover" />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.images.map((u, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={"aspect-square w-20 overflow-hidden rounded-lg ring-2 transition " +
                    (i === imgIdx ? "ring-rose-gold" : "ring-transparent")}
                >
                  <img src={u} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="rose">{product.category}</Badge>
            {product.stock > 0
              ? <Badge tone="green">In Stock</Badge>
              : <Badge tone="red">Sold Out</Badge>}
          </div>
          <h1 className="mt-3 font-serif text-4xl text-ink">{product.title}</h1>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-serif text-3xl text-rose-gold-dark">{formatINR(price)}</span>
            {hasDiscount && (
              <>
                <span className="text-base text-ink/40 line-through">{formatINR(product.price)}</span>
                <span className="text-sm font-medium text-emerald-700">
                  {Math.round((1 - price / product.price) * 100)}% OFF
                </span>
              </>
            )}
          </div>
          <p className="mt-5 text-sm leading-relaxed text-ink/70">{product.description}</p>

          <div className="mt-6 space-y-5">
            <div>
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-ink/60">Size</div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={"rounded-full border px-4 py-1.5 text-sm transition " +
                      (size === s ? "border-rose-gold bg-rose-gold text-white" : "border-ink/15 hover:border-rose-gold")}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-ink/60">Color</div>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={"rounded-full border px-4 py-1.5 text-sm transition " +
                      (color === c ? "border-rose-gold bg-rose-gold text-white" : "border-ink/15 hover:border-rose-gold")}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-ink/60">Quantity</div>
              <div className="inline-flex items-center rounded-full border border-ink/15">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-2 text-lg">−</button>
                <span className="w-10 text-center text-sm">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="px-4 py-2 text-lg">+</button>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-col sm:flex-row gap-3 w-full">
            <Button onClick={addToCart} disabled={product.stock === 0} className="w-full sm:w-auto">Add to Cart</Button>
            <Button variant="ink" onClick={buyNow} disabled={product.stock === 0} className="w-full sm:w-auto">Buy Now</Button>
            <Button variant="outline" onClick={toggleWish} className="w-full sm:w-auto">
              {isWished ? "♥ Wishlisted" : "♡ Add to Wishlist"}
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
            <Spec label="Fabric" value={product.fabric} />
            <Spec label="Stock" value={String(product.stock) + " pieces"} />
            <Spec label="Category" value={product.category} />
            <Spec label="Customization" value="Available" />
          </div>

          <div className="mt-8 rounded-2xl bg-blush/60 p-5">
            <div className="font-serif text-lg">Want this in your custom design?</div>
            <p className="mt-1 text-sm text-ink/70">
              Send us a custom request and our designers will tailor this piece exactly the way you imagine.
            </p>
            <div className="mt-3">
              <Link to="/custom" className="text-sm font-medium text-rose-gold-dark hover:underline">
                Start a custom request →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-ink/5">
      <div className="text-[10px] uppercase tracking-wider text-ink/50">{label}</div>
      <div className="mt-0.5 text-ink">{value}</div>
    </div>
  );
}
