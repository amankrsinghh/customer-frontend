// Tiny hash-based router used by both apps.
// Hash format: #/path/segment  -> { path: "/path/segment", params: ... }
import { useEffect, useState, type ReactNode } from "react";

export function useHashRoute(): { path: string; navigate: (to: string) => void } {
  const [hash, setHash] = useState<string>(window.location.hash || "#/");
  useEffect(() => {
    const handler = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  const path = hash.replace(/^#/, "") || "/";
  const navigate = (to: string) => {
    window.location.hash = to.startsWith("/") ? to : "/" + to;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return { path, navigate };
}

export function Link({
  to, children, className, onClick,
}: { to: string; children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <a
      href={"#" + to}
      onClick={() => { onClick?.(); }}
      className={className}
    >
      {children}
    </a>
  );
}

/** Match a static route and optional :param style. Returns params or null. */
export function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const pSegs = pattern.split("/").filter(Boolean);
  const aSegs = path.split("/").filter(Boolean);
  if (pSegs.length !== aSegs.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pSegs.length; i++) {
    if (pSegs[i].startsWith(":")) params[pSegs[i].slice(1)] = decodeURIComponent(aSegs[i]);
    else if (pSegs[i] !== aSegs[i]) return null;
  }
  return params;
}
