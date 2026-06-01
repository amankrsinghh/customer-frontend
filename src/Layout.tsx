// Customer site layout — navbar, footer, WhatsApp FAB.
import { useEffect, useState, type ReactNode } from "react";
import { Link, useHashRoute } from "./shared/router";
import { useAuth, signOut } from "./shared/auth";
import { onCartChange, onWishlistChange } from "./shared/mockStore";

const WHATSAPP_NUMBER = "918002929778"; // real WhatsApp number

export function CustomerLayout({ children }: { children: ReactNode }) {
  const { navigate, path } = useHashRoute();
  const user = useAuth();
  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishCount, setWishCount] = useState(0);

  useEffect(() => {
    if (!user) { setCartCount(0); setWishCount(0); return; }
    const u1 = onCartChange(user.uid, (c) => setCartCount(c.reduce((s, i) => s + i.quantity, 0)));
    const u2 = onWishlistChange(user.uid, (w) => setWishCount(w.length));
    return () => { u1(); u2(); };
  }, [user]);

  // Close mobile menu on navigation
  useEffect(() => { setOpen(false); }, [path]);

  const NavLink = ({ to, label }: { to: string; label: string }) => (
    <Link
      to={to}
      className={
        "text-sm tracking-wide transition hover:text-rose-gold " +
        (path === to ? "text-rose-gold" : "text-ink/80")
      }
    >
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen bg-cream overflow-x-hidden">
      {/* Announcement bar */}
      <div className="bg-ink text-white">
        <div className="mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-2 text-center text-[10px] sm:text-[11px] uppercase tracking-[0.1em] sm:tracking-[0.2em]">
          <span>✦</span>
          <span>Free shipping on orders above ₹5,000 · Made-to-Measure Available</span>
          <span>✦</span>
        </div>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-ink/5 bg-cream/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>

          <Link to="/" className="flex items-center gap-2">
            <span className="font-serif text-2xl tracking-tight">
              Tavishalove<span className="text-rosegold-gradient">.</span>
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.3em] text-ink/50 sm:inline">
              Store
            </span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            <NavLink to="/" label="Home" />
            <NavLink to="/shop" label="Shop" />
            <NavLink to="/custom" label="Custom Dress" />
            <NavLink to="/contact" label="Contact" />
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/wishlist" className="relative" >
              <Heart />
              {wishCount > 0 && <Pip n={wishCount} />}
            </Link>
            <Link to="/cart" className="relative">
              <Bag />
              {cartCount > 0 && <Pip n={cartCount} />}
            </Link>
            {user ? (
              <Link to="/profile" className="hidden text-sm text-ink/80 hover:text-rose-gold sm:inline">
                Hi, {user.name.split(" ")[0]}
              </Link>
            ) : (
              <button onClick={() => navigate("/login")} className="hidden text-sm text-ink/80 hover:text-rose-gold sm:inline">
                Sign in
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="border-t border-ink/5 lg:hidden fade-up">
            <div className="flex flex-col gap-4 px-6 py-5">
              <NavLink to="/" label="Home" />
              <NavLink to="/shop" label="Shop" />
              <NavLink to="/custom" label="Custom Dress" />
              <NavLink to="/contact" label="Contact" />
              <NavLink to="/orders" label="My Orders" />
              <NavLink to="/profile" label="Profile" />
              {!user && <NavLink to="/login" label="Sign in" />}
              {user && (
                <button onClick={() => { signOut(); navigate("/"); }} className="text-left text-sm text-rose-gold-dark">
                  Sign out
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="fade-in">{children}</main>

      {/* Footer */}
      <footer className="mt-20 border-t border-ink/5 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-4 lg:px-8">
          <div>
            <div className="font-serif text-2xl">Tavishalove<span className="text-rosegold-gradient">.</span></div>
            <p className="mt-3 text-sm leading-relaxed text-ink/60">
              Luxury made-to-measure fashion, hand-crafted in India.
              Designed for the modern woman who refuses the ordinary.
            </p>
          </div>
          <FootCol title="Shop" items={[
            ["Bridal", "/shop?cat=Bridal"],
            ["Lehenga", "/shop?cat=Lehenga"],
            ["Gowns",   "/shop?cat=Gown"],
            ["Sarees",  "/shop?cat=Saree"],
          ]} />
          <FootCol title="Help" items={[
            ["Custom Dress Request", "/custom"],
            ["My Orders", "/orders"],
            ["Contact",   "/contact"],
            ["Wishlist",  "/wishlist"],
          ]} />
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-ink/60">Stay In Touch</div>
            <form onSubmit={(e) => e.preventDefault()} className="mt-4 flex">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 rounded-l-full border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none"
              />
              <button className="btn-rosegold rounded-l-none rounded-r-full px-5 py-2.5 text-sm font-medium">
                Join
              </button>
            </form>
            <div className="mt-6 flex gap-3 text-sm text-ink/60">
              <span>Instagram</span>·<span>Facebook</span>·<span>Pinterest</span>
            </div>
          </div>
        </div>
        <div className="border-t border-ink/5 py-5 text-center text-xs text-ink/50">
          © {new Date().getFullYear()} Tavishalove Store · Crafted with love in India
        </div>
      </footer>

      {/* WhatsApp FAB */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20Tavishalove!%20I%20have%20a%20question%20about%20your%20dresses.`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/40 transition hover:scale-110"
        aria-label="Chat on WhatsApp"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
          <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.86 11.86 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.004 6.557-5.338 11.892-11.892 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.595 5.392l-.999 3.648 3.893-.74zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
        </svg>
      </a>
    </div>
  );
}

function FootCol({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.25em] text-ink/60">{title}</div>
      <ul className="mt-4 space-y-2 text-sm text-ink/80">
        {items.map(([label, href]) => (
          <li key={href}>
            <Link to={href} className="hover:text-rose-gold">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Pip({ n }: { n: number }) {
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-gold px-1 text-[10px] font-bold text-white">
      {n}
    </span>
  );
}
function Heart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}
function Bag() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
    </svg>
  );
}
