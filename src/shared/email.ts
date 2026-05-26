import type { Order } from "./types";
import { settingsDB } from "./mockStore";

const EMAIL_SERVICE_URL = import.meta.env.VITE_EMAIL_SERVICE_URL ?? "";

/** Fetches the current email_settings document from settingsDB */
function getEmailSettings() {
  const items = settingsDB.all();
  const em = items.find((x: any) => x.id === "email_settings");
  return em ?? {};
}

/** Replace {customerName}, {orderId}, {status} placeholders in a template string */
function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

/** Send order confirmation email (to customer) */
export async function sendOrderConfirmationEmail(order: Order): Promise<boolean> {
  if (EMAIL_SERVICE_URL) {
    try {
      const em = getEmailSettings() as any;
      const vars = { customerName: order.customerName, orderId: order.id ?? "", status: "" };

      const payload: Record<string, unknown> = {
        type: "email",
        emailType: "confirmation",
        to: order.email,
        name: order.customerName,
        orderId: order.id,
        total: order.total,
        items: order.items
          .map((it) => `${it.title} (Size: ${it.size} / ${it.color}) x${it.quantity}`)
          .join(", "),
      };

      // Pass custom template fields if admin configured them
      if (em.confirmSubject)  payload.confirmSubject  = fillTemplate(em.confirmSubject, vars);
      if (em.confirmGreeting) payload.confirmGreeting = fillTemplate(em.confirmGreeting, vars);
      if (em.confirmMessage)  payload.confirmMessage  = fillTemplate(em.confirmMessage, vars);

      await fetch(EMAIL_SERVICE_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload),
      });
      return true;
    } catch (err) {
      console.error("[EmailService] Failed to send order confirmation email:", err);
    }
  }

  // --- MOCK IN-BROWSER PREVIEW IN CONSOLE (when no service URL configured) ---
  console.log(
    `%c✦ TAVISHALOVE STORE EMAIL (MOCK) — ORDER CONFIRMED ✦`,
    "background:#111116;color:#c9a07f;font-family:serif;font-size:13px;padding:4px 10px;border-radius:4px;"
  );
  console.log(
    `%cTo: ${order.email}\nOrder: #${order.id}\nTotal: ₹${order.total}\nItems: ${
      order.items.map((it) => `${it.title} x${it.quantity}`).join(", ")
    }`,
    "color:#333;font-size:12px;"
  );
  return true;
}

/** Send order status update email (to customer) */
export async function sendOrderStatusUpdateEmail(order: Order): Promise<boolean> {
  if (EMAIL_SERVICE_URL) {
    try {
      const em = getEmailSettings() as any;
      const vars = { customerName: order.customerName, orderId: order.id ?? "", status: order.orderStatus ?? "" };

      const payload: Record<string, unknown> = {
        type: "email",
        emailType: "status",
        to: order.email,
        name: order.customerName,
        orderId: order.id,
        status: order.orderStatus,
      };

      // Pass custom template fields if admin configured them
      if (em.statusSubject)  payload.statusSubject  = fillTemplate(em.statusSubject, vars);
      if (em.statusGreeting) payload.statusGreeting = fillTemplate(em.statusGreeting, vars);
      if (em.statusMessage)  payload.statusMessage  = fillTemplate(em.statusMessage, vars);

      await fetch(EMAIL_SERVICE_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload),
      });
      return true;
    } catch (err) {
      console.error("[EmailService] Failed to send status update email:", err);
    }
  }

  // --- MOCK IN-BROWSER PREVIEW IN CONSOLE (when no service URL configured) ---
  console.log(
    `%c✦ TAVISHALOVE STORE EMAIL (MOCK) — STATUS: ${order.orderStatus?.toUpperCase()} ✦`,
    "background:#c9a07f;color:#fff;font-family:serif;font-size:13px;padding:4px 10px;border-radius:4px;"
  );
  console.log(
    `%cTo: ${order.email}\nOrder: #${order.id}\nNew Status: ${order.orderStatus}`,
    "color:#333;font-size:12px;"
  );
  return true;
}
