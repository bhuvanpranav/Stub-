import type { VercelRequest, VercelResponse } from "@vercel/node";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return res.status(405).send("Method not allowed");

    // 🧠 Check env vars first
    const key_id = process.env.VITE_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    const supabase_url = process.env.VITE_SUPABASE_URL;
    const supabase_key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!key_id || !key_secret) {
      console.error("❌ Razorpay keys missing:", { key_id, hasSecret: !!key_secret });
      return res.status(500).json({ error: "Missing Razorpay credentials" });
    }
    if (!supabase_url || !supabase_key) {
      console.error("❌ Supabase env missing:", { supabase_url, supabase_key });
      return res.status(500).json({ error: "Missing Supabase credentials" });
    }

    const supabase = createClient(supabase_url, supabase_key);

    const { eventId, qty, email } = req.body as { eventId: string; qty: number; email: string };
    if (!eventId || !qty || !email) {
      return res.status(400).json({ error: "Missing booking fields" });
    }

    // 🧩 Fetch event details
    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select("id, price_rupees, title")
      .eq("id", eventId)
      .single();

    if (evErr || !ev) {
      console.error("❌ Event not found:", evErr);
      return res.status(404).json({ error: "event_not_found" });
    }

    const amount_paise = Number(ev.price_rupees) * Number(qty) * 100;

    // 🪄 Initialize Razorpay
    console.log("🟢 Creating Razorpay order using:", { key_id, hasSecret: !!key_secret });
    const rzp = new Razorpay({ key_id, key_secret });

    // Shorten receipt (<40 chars)
    const shortEventId = ev.id.slice(0, 8);
    const receipt = `evt_${shortEventId}_${Date.now().toString().slice(-6)}`;

    // 🧾 Create order
    const order = await rzp.orders.create({
      amount: amount_paise,
      currency: "INR",
      receipt,
      notes: { eventId: ev.id, qty: String(qty), email },
    });

    // 🧠 Save order in Supabase
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

    if (ordErr) {
      console.error("❌ Failed to insert order:", ordErr);
      return res.status(500).json({ error: "db_order_insert_failed" });
    }

    return res.json({
      key: key_id,
      orderId: order.id,
      amount: order.amount,
      currency: "INR",
      localOrderId: ord.id,
      eventTitle: ev.title,
    });
  } catch (e: any) {
    console.error("💥 Razorpay create order failed:", e);
    return res.status(500).json({ error: "razorpay_create_failed", detail: e });
  }
}
