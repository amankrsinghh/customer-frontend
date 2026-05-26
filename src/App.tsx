import { useEffect } from "react";
import { CustomerLayout } from "./Layout";
import { useHashRoute, matchRoute } from "./shared/router";
import { Home } from "./pages/Home";
import { Shop } from "./pages/Shop";
import { ProductDetail } from "./pages/ProductDetail";
import { Cart, Wishlist } from "./pages/CartWishlist";
import { Checkout } from "./pages/Checkout";
import { Login, Signup } from "./pages/Auth";
import { MyOrders } from "./pages/Orders";
import { Profile } from "./pages/Profile";
import { CustomRequest, Contact } from "./pages/Misc";
import { ensureDemoCustomer } from "./shared/auth";
import { ToastHost } from "./shared/ui";

export default function App() {
  const { path } = useHashRoute();
  useEffect(() => { ensureDemoCustomer(); }, []);

  // Strip query string for route matching
  const cleanPath = path.split("?")[0];

  let view: React.ReactNode = <Home />;
  if (cleanPath === "/" || cleanPath === "")    view = <Home />;
  else if (cleanPath === "/shop")               view = <Shop />;
  else if (cleanPath === "/cart")               view = <Cart />;
  else if (cleanPath === "/wishlist")           view = <Wishlist />;
  else if (cleanPath === "/checkout")           view = <Checkout />;
  else if (cleanPath === "/login")              view = <Login />;
  else if (cleanPath === "/signup")             view = <Signup />;
  else if (cleanPath === "/orders")             view = <MyOrders />;
  else if (cleanPath === "/profile")            view = <Profile />;
  else if (cleanPath === "/custom")             view = <CustomRequest />;
  else if (cleanPath === "/contact")            view = <Contact />;
  else {
    const m = matchRoute("/product/:id", cleanPath);
    if (m) view = <ProductDetail id={m.id} />;
    else view = <NotFound />;
  }

  return (
    <>
      <ToastHost />
      <CustomerLayout>{view}</CustomerLayout>
    </>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-32 text-center">
      <div className="font-serif text-6xl text-rose-gold-dark">404</div>
      <div className="mt-3 font-serif text-2xl">Page not found</div>
      <a href="#/" className="mt-5 inline-block text-rose-gold hover:underline">← Return home</a>
    </div>
  );
}
