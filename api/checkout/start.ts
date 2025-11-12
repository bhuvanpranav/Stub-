// /api/checkout/start.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!; // server only

const RAZORPAY_KEY_ID = process.env.VITE_RAZORPAY_KEY_ID!;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE); // service role for server

const rzp = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

    const { eventId, qty = 1, email = "" } = req.body || {};
    if (!eventId) return res.status(400).json({ error: "missing_eventId" });

    // Load event from DB (short select)
    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select("id,price_rupees,title")
      .eq("id", eventId)
      .limit(1)
      .single();

    if (evErr || !ev) {
      console.error("event load failed:", evErr);
      return res.status(404).json({ error: "event_not_found" });
    }

    // amount in paise
    const amountPaise = Number(ev.price_rupees || 0) * Number(qty) * 100;

    // generate a short receipt (<= 40 chars)
    const shortReceipt = `r_${Date.now() % 1000000000}`; // short and unique-ish

    // Create Razorpay order
    const rzpOrder = await rzp.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: shortReceipt,      // <-- keep receipt short
      notes: { eventId: String(eventId), qty: String(qty), email: String(email) }
    }).catch((err: any) => {
      // log and rethrow to be handled below
      console.error("rzp.orders.create error:", err);
      throw err;
    });

    // Insert a local order record in Supabase
    const { data: ord, error: ordErr } = await supabase
      .from("orders")
      .insert({
        provider_order_id: rzpOrder?.id,
        email,
        qty,
        amount_paise: amountPaise,
        event_id: eventId,
        status: "pending",
      })
      .select("id")
      .single();

    if (ordErr) {
      console.error("supabase order insert failed:", ordErr);
      // still return rzp order to allow client to attempt (but mark error)
      return res.status(500).json({ error: "db_insert_failed", detail: ordErr.message || ordErr });
    }

    // Return the data the client expects
    return res.json({
      key: RAZORPAY_KEY_ID,          // client uses this to open checkout
      orderId: rzpOrder?.id,         // razorpay order id
      amount: rzpOrder?.amount,      // amount (paise)
      currency: rzpOrder?.currency || "INR",
      localOrderId: ord?.id
    });

  } catch (err: any) {
    console.error("checkout/start caught error:", err);
    // If err from Razorpay, include readable details but not secrets
    if (err?.statusCode && err?.error) {
      return res.status(500).json({ error: "razorpay_create_failed", detail: err.error || err });
    }
    return res.status(500).json({ error: "unknown_error", detail: String(err) });
  }
}
