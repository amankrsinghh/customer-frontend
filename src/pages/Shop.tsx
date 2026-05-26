import { useEffect, useMemo, useState } from "react";
import { productsDB, categoriesDB } from "../shared/mockStore";
import type { Category, Product, CategoryItem } from "../shared/types";
import { Empty } from "../shared/ui";
import { ProductCard } from "./Home";

function parseQuery() {
  const hash = window.location.hash;
  const q = hash.includes("?") ? hash.split("?")[1] : "";
  return Object.fromEntries(new URLSearchParams(q));
}

export function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [cat, setCat] = useState<"All" | Category>(() => (parseQuery().cat as Category) || "All");
  const [sort, setSort] = useState<"new" | "lo" | "hi">("new");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const u1 = productsDB.subscribe(setProducts);
    const u2 = categoriesDB.subscribe(setCategories);
    return () => { u1(); u2(); };
  }, []);

  // Keep ?cat= in sync when hash changes externally
  useEffect(() => {
    const fn = () => {
      const q = parseQuery();
      if (q.cat) setCat(q.cat as Category);
    };
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);

  // Dynamically map categories for filters
  const dynamicCats = useMemo(() => {
    return ["All", ...categories.map((c) => c.name)];
  }, [categories]);

  const list = useMemo(() => {
    let l = [...products];
    if (cat !== "All") l = l.filter((p) => p.category === cat);
    if (search) {
      const s = search.toLowerCase();
      l = l.filter((p) =>
        p.title.toLowerCase().includes(s) ||
        p.fabric.toLowerCase().includes(s) ||
        p.category.toLowerCase().includes(s),
      );
    }
    if (sort === "lo")  l.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
    if (sort === "hi")  l.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
    if (sort === "new") l.sort((a, b) => b.createdAt - a.createdAt);
    return l;
  }, [products, cat, sort, search]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="mb-8 text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-rose-gold-dark">The Collection</div>
        <h1 className="mt-2 font-serif text-4xl lg:text-5xl">Shop All Pieces</h1>
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {dynamicCats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={
                "rounded-full px-4 py-1.5 text-xs uppercase tracking-wider transition " +
                (cat === c
                  ? "bg-ink text-white"
                  : "border border-ink/15 text-ink/70 hover:border-rose-gold hover:text-rose-gold")
              }
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-44 rounded-full border border-ink/15 bg-white px-4 py-2 text-sm outline-none focus:border-rose-gold"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "new" | "lo" | "hi")}
            className="rounded-full border border-ink/15 bg-white px-4 py-2 text-sm outline-none focus:border-rose-gold"
          >
            <option value="new">Newest</option>
            <option value="lo">Price: Low to High</option>
            <option value="hi">Price: High to Low</option>
          </select>
        </div>
      </div>

      {list.length === 0 ? (
        <Empty title="No pieces found" subtitle="Try a different category or search term." />
      ) : (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {list.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
