// ============================================================================
// Google Sheets integration helper
// ----------------------------------------------------------------------------
// The simplest, free way to push orders into a Google Spreadsheet is to use
// a Google Apps Script Web App as the receiving webhook. No server required.
//
// 1. Create a new Google Sheet with this header row:
//    Order ID | Customer Name | Phone | Address | Product Name | Quantity |
//    Price | Payment Status | Order Status | Date & Time
//
// 2. Extensions → Apps Script, paste:
//
//    const SHEET_ID = "YOUR_SHEET_ID";
//    function doPost(e) {
//      const data = JSON.parse(e.postData.contents);
//      const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
//      (data.rows || []).forEach(row => sheet.appendRow(row));
//      return ContentService.createTextOutput(JSON.stringify({ok:true}))
//        .setMimeType(ContentService.MimeType.JSON);
//    }
//
// 3. Deploy → New Deployment → Web App → Execute as: Me, Access: Anyone.
// 4. Copy the Web App URL into the .env as VITE_SHEETS_WEBHOOK_URL.
// ============================================================================

import type { Order } from "./types";

const SHEETS_WEBHOOK_URL = import.meta.env.VITE_SHEETS_WEBHOOK_URL ?? "";

export async function pushOrderToSheet(order: Order): Promise<boolean> {
  // Build one spreadsheet row per item ordered (so spreadsheet stays granular).
  const rows = order.items.map((item) => [
    order.id,
    order.customerName,
    order.phone,
    order.address,
    item.title,
    item.quantity,
    item.price * item.quantity,
    order.paymentStatus,
    order.orderStatus,
    new Date(order.createdAt).toLocaleString(),
  ]);

  if (!SHEETS_WEBHOOK_URL) {
    // No webhook configured yet — log so devs can see the payload.
    // eslint-disable-next-line no-console
    console.info("[GoogleSheets] (mock) would POST:", { 
      rows,
      email: order.email,
      customerName: order.customerName,
      id: order.id,
      total: order.total
    });
    return true;
  }

  try {
    await fetch(SHEETS_WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors", // Apps Script returns CORS-less response; we don't read it
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        rows,
        email: order.email,
        customerName: order.customerName,
        id: order.id,
        total: order.total,
        items: order.items.map(it => `${it.title} (${it.size}/${it.color}) x${it.quantity}`).join(", ")
      }),
    });
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[GoogleSheets] push failed:", err);
    return false;
  }
}
