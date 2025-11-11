import type { VercelRequest, VercelResponse } from "@vercel/node";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return res.status(405).send("Method not allowed");
    const { eventId, qty, email } = req.body as { eventId: string; qty: number; email: string };

    const { data: ev, error: evErr } = await supabase
      .from("events").select("id, price_rupees, title").eq("id", eventId).single();
    if (evErr || !ev) return res.status(404).json({ error: "event_not_found" });

    const amount_paise = Number(ev.price_rupees) * Number(qty) * 100;

    const rzp = new Razorpay({
      key_id: process.env.VITE_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!
    });

    const order = await rzp.orders.create({
      amount: amount_paise,
      currency: "INR",
      receipt: `evt_${ev.id}_${Date.now()}`,
      notes: { eventId: ev.id, qty: String(qty), email }
    });

    const { data: ord, error: ordErr } = await supabase
      .from("orders")
      .insert({
        provider_order_id: order.id,
        email,
        qty,
        amount_paise,
        event_id: ev.id,
        status: "pending"
      })
      .select("id").single();

    if (ordErr) return res.status(500).json({ error: "db_order_insert_failed" });

    return res.json({
      key: process.env.VITE_RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: "INR",
      localOrderId: ord.id,
      eventTitle: ev.title
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
