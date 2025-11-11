import type { VercelRequest, VercelResponse } from "@vercel/node";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "nodejs18.x" }; // ensure Node runtime

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return res.status(405).send("Method not allowed");
    const { eventId, qty = 1, email = "" } = req.body || {};

    // 1) Fetch event price (or hardcode for now)
    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select("id, title, price_rupees")
      .eq("id", eventId)
      .single();
    if (evErr || !ev) return res.status(404).json({ error: "event_not_found" });

    const amount_paise = Number(ev.price_rupees) * Number(qty) * 100;

    // 2) Init Razorpay with TEST keys
    const keyId = process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // 🔎 DEBUG (safe): log only prefixes/lengths
    console.log("rzp key id (prefix):", keyId?.slice(0, 10));
    console.log("rzp secret length:", keySecret?.length);

    const rzp = new Razorpay({
      key_id: keyId as string,
      key_secret: keySecret as string,
    });

    // 3) Receipt must be <= 40 chars
    const shortEvent = String(ev.id).replace(/[^a-z0-9]/gi, "").slice(0, 8);
    const shortTs = Date.now().toString().slice(-8);
    const receipt = `ev_${shortEvent}_${shortTs}`; // always < 40

    // 4) Create order
    const order = await rzp.orders.create({
      amount: amount_paise,
      currency: "INR",
      receipt,
      notes: { eventId: ev.id, qty: String(qty), email },
    });

    // 5) Store local order
    const { data: ord, error: ordErr } = await supabase
      .from("orders")
      .insert({
        provider_order_id: order.id,
        email,
        qty,
        amount_paise,
        event_id: ev.id,
        status: "pending",
      })
      .select("id")
      .single();
    if (ordErr) return res.status(500).json({ error: "db_order_insert_failed" });

    return res.json({
      key: keyId,                // used by frontend checkout
      orderId: order.id,
      amount: order.amount,
      currency: "INR",
      localOrderId: ord.id,
      eventTitle: ev.title,
    });
  } catch (e: any) {
    console.error("razorpay_create_failed:", e); // <- check Vercel logs if 500
    return res.status(500).json({ error: "razorpay_create_failed", detail: e });
  }
}
