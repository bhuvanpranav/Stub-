// /api/checkout/start.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!   // IMPORTANT: use SERVICE_ROLE on server
);

// Helper to make a short receipt (Razorpay limits to 40 chars)
function makeReceipt(eventId: string) {
  return `ev_${eventId.slice(0, 20)}_${Date.now().toString().slice(-6)}`.slice(0, 40);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return res.status(405).send("Method not allowed");
    const { eventId, qty = 1, email } = req.body as { eventId: string; qty?: number; email?: string };
    if (!eventId) return res.status(400).json({ error: "missing_eventId" });

    const { data: ev, error: evErr } = await supabase
      .from("events").select("id,price_rupees,title").eq("id", eventId).single();

    if (evErr || !ev) return res.status(404).json({ error: "event_not_found" });

    const amount_paise = Number(ev.price_rupees) * Number(qty) * 100;

    // Razorpay init
    const rzp = new Razorpay({
      key_id: process.env.VITE_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!
    });

    const orderPayload = {
      amount: amount_paise,
      currency: "INR",
      receipt: makeReceipt(ev.id),
      notes: { eventId: ev.id, qty: String(qty), email: email || "" }
    };

    let rzpOrder;
    try {
      rzpOrder = await rzp.orders.create(orderPayload);
    } catch (err: any) {
      console.error("razorpay_create_failed:", err);
      return res.status(500).json({ error: "razorpay_create_failed", detail: err });
    }

    const { data: ord, error: ordErr } = await supabase
      .from("orders")
      .insert({
        provider_order_id: rzpOrder.id,
        email: email || null,
        qty,
        amount_paise,
        event_id: ev.id,
        status: "pending"
      })
      .select("id")
      .single();

    if (ordErr || !ord) {
      console.error("db_insert_failed:", ordErr);
      return res.status(500).json({ error: "db_insert_failed", detail: ordErr });
    }

    return res.json({
      key: process.env.VITE_RAZORPAY_KEY_ID,
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: "INR",
      localOrderId: ord.id,
      eventTitle: ev.title
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
