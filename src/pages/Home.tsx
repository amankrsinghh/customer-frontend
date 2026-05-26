import { useEffect, useState } from "react";
import { Link, useHashRoute } from "../shared/router";
import { Button, formatINR } from "../shared/ui";
import { productsDB, categoriesDB, settingsDB } from "../shared/mockStore";
import type { Product, CategoryItem } from "../shared/types";

const DEFAULT_CAT_IMAGES: Record<string, string> = {
  "Bridal":       "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600",
  "Lehenga":      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600",
  "Gown":         "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600",
  "Saree":        "https://images.unsplash.com/photo-1610189025157-770a35e08e8e?w=600",
  "Indo-Western": "https://images.unsplash.com/photo-1595777216528-071e0127ccbf?w=600",
  "Anarkali":     "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600",
};

export function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [hero, setHero] = useState<any>(null);
  const { navigate } = useHashRoute();

  useEffect(() => {
    const u1 = productsDB.subscribe(setProducts);
    const u2 = categoriesDB.subscribe(setCategories);
    const u3 = settingsDB.subscribe((items) => {
      const h = items.find((x) => x.id === "home_hero");
      if (h) setHero(h);
    });
    return () => { u1(); u2(); u3(); };
  }, []);

  const featured = products.filter((p) => p.featured).slice(0, 4);
  const newest   = [...products].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);

  // Dynamic homepage Hero values with preseeded fallbacks
  const heroBadge = hero?.badgeText || "Made to Measure ✦ Crafted in India";
  const heroTitle = hero?.title || "Wear the dress";
  const heroItalic = hero?.italicTitle || "made only for you";
  const heroSubtitle = hero?.subtitle || "Heirloom-quality dresses, hand-finished by master artisans and tailored to your exact measurements. From bridal couture to everyday luxury.";
  const heroImage = hero?.imageLink || "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=900";
  const heroTagline = hero?.imageTagline || "Bridal Edit";
  const heroImgTitle = hero?.imageTitle || "The Ivory Story";

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blush via-cream to-white" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
          <div className="fade-up">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-rose-gold-dark ring-1 ring-rose-gold/20">
              <span>✦</span> {heroBadge} ✦
            </div>
            <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-ink lg:text-7xl">
              {heroTitle}<br />
              <span className="text-rosegold-gradient italic">{heroItalic}</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink/70">
              {heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => navigate("/shop")}>Shop Collection</Button>
              <Button variant="outline" onClick={() => navigate("/custom")}>
                Design Your Own
              </Button>
            </div>
            <div className="mt-10 grid max-w-md grid-cols-3 gap-6 text-center">
              {[
                ["10K+", "Happy Brides"],
                ["7 Days", "Tailoring"],
                ["100%", "Custom Fit"],
              ].map(([k, v]) => (
                <div key={v}>
                  <div className="font-serif text-2xl text-rose-gold-dark">{k}</div>
                  <div className="mt-0.5 text-[11px] uppercase tracking-wider text-ink/50">{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative fade-up">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] shadow-2xl shadow-rose-gold/20">
              <img
                src={heroImage}
                alt="Featured dress"
                className="h-full w-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                <div className="text-xs uppercase tracking-[0.25em] text-white/80">{heroTagline}</div>
                <div className="font-serif text-2xl text-white">{heroImgTitle}</div>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 hidden h-28 w-28 rotate-12 items-center justify-center rounded-full bg-white text-center text-[11px] font-semibold uppercase tracking-wider text-rose-gold-dark shadow-xl sm:flex">
              Free <br /> Shipping <br /> ₹5000+
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <SectionHead eyebrow="The Edit" title="Shop by Category" />
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => {
            const img = c.image || DEFAULT_CAT_IMAGES[c.name] || "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600";
            return (
              <Link
                key={c.id}
                to={`/shop?cat=${c.name}`}
                className="group relative aspect-[3/4] overflow-hidden rounded-xl"
              >
                <img src={img} alt={c.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
                <div className="absolute inset-x-0 bottom-3 text-center font-serif text-lg text-white">
                  {c.name}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
          <SectionHead eyebrow="Curated For You" title="Featured Pieces" cta={{ to: "/shop", label: "View All →" }} />
          <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* CUSTOM CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-ink p-10 text-white lg:p-16">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-rose-gold/30 blur-3xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-rose-gold-light">Bespoke Service</div>
              <h2 className="mt-3 font-serif text-4xl lg:text-5xl">Design your dream dress.</h2>
              <p className="mt-4 max-w-md text-white/70">
                Send us an inspiration, share your measurements and budget — our designers will bring it to life,
                stitch by stitch.
              </p>
              <div className="mt-6">
                <Button onClick={() => navigate("/custom")} variant="rosegold">
                  Start Custom Request
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {["https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400",
                "https://images.unsplash.com/photo-1617922001439-4a2e6562f328?w=400",
                "https://images.unsplash.com/photo-1591348278863-a8fb3887e2aa?w=400"].map((u, i) => (
                <div key={i} className="aspect-[3/4] overflow-hidden rounded-xl">
                  <img src={u} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <SectionHead eyebrow="Fresh In" title="New Arrivals" />
        <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {newest.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>
    </div>
  );
}

function SectionHead({ eyebrow, title, cta }: {
  eyebrow: string; title: string; cta?: { to: string; label: string };
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-rose-gold-dark">{eyebrow}</div>
        <h2 className="mt-2 font-serif text-3xl text-ink lg:text-4xl">{title}</h2>
      </div>
      {cta && (
        <Link to={cta.to} className="text-sm text-ink/70 hover:text-rose-gold">
          {cta.label}
        </Link>
      )}
    </div>
  );
}

export function ProductCard({ p }: { p: Product }) {
  const price = p.discountPrice ?? p.price;
  const hasDiscount = !!p.discountPrice && p.discountPrice < p.price;
  return (
    <Link to={`/product/${p.id}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-blush">
        {p.images[0] ? (
          <img
            src={p.images[0]}
            alt={p.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : <div className="shimmer h-full w-full" />}
        {hasDiscount && (
          <div className="absolute left-3 top-3 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-gold-dark">
            {Math.round((1 - price / p.price) * 100)}% off
          </div>
        )}
        {p.stock <= 5 && p.stock > 0 && (
          <div className="absolute right-3 top-3 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
            Few left
          </div>
        )}
      </div>
      <div className="mt-3 px-1">
        <div className="text-[10px] uppercase tracking-[0.2em] text-ink/50">{p.category}</div>
        <div className="mt-0.5 font-serif text-lg text-ink line-clamp-1">{p.title}</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-sm font-medium text-ink">{formatINR(price)}</span>
          {hasDiscount && (
            <span className="text-xs text-ink/40 line-through">{formatINR(p.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
