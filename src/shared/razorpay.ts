// ============================================================================
// Razorpay PLACEHOLDER integration
// ----------------------------------------------------------------------------
// Drop-in structure so production keys can be added later without rewriting.
// When ready:
//   1. Add VITE_RAZORPAY_KEY_ID to .env
//   2. Implement /api/razorpay/order on your backend to create an order
//   3. Uncomment the window.Razorpay() block below
// ============================================================================

export interface RazorpayPayload {
  amount: number;       // in INR (we convert to paise internally)
  orderId: string;
  customerName: string;
  email: string;
  phone: string;
  onSuccess: (paymentId: string) => void;
  onFailure: (err: unknown) => void;
}

export async function openRazorpayCheckout(p: RazorpayPayload): Promise<void> {
  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID ?? "";

  if (!keyId) {
    // PLACEHOLDER mode — simulate a successful payment after a short delay
    // so the UX can be tested end-to-end without real Razorpay keys.
    await new Promise((r) => setTimeout(r, 800));
    p.onSuccess("MOCK_PAYMENT_" + Date.now());
    return;
  }

  /*
  // ---------- ENABLE WHEN KEYS ARE READY ----------
  await loadScript("https://checkout.razorpay.com/v1/checkout.js");

  // @ts-expect-error - Razorpay attaches itself to window at runtime
  const rzp = new window.Razorpay({
    key: keyId,
    amount: Math.round(p.amount * 100),
    currency: "INR",
    name: "Tavishalove Store",
    description: "Order #" + p.orderId,
    prefill: { name: p.customerName, email: p.email, contact: p.phone },
    theme: { color: "#b76e79" },
    handler: (resp: { razorpay_payment_id: string }) =>
      p.onSuccess(resp.razorpay_payment_id),
  });
  rzp.on("payment.failed", p.onFailure);
  rzp.open();
  */
}

// function loadScript(src: string) {
//   return new Promise<void>((resolve, reject) => {
//     const s = document.createElement("script");
//     s.src = src;
//     s.onload = () => resolve();
//     s.onerror = () => reject(new Error("Failed to load " + src));
//     document.body.appendChild(s);
//   });
// }
