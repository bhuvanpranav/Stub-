import type { VercelRequest, VercelResponse } from "@vercel/node";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";

const must = (v: string | undefined, name: string) => {
  if (!v) throw new Error(`env_missing:${name}`);
  return v;
};

const supabase = createClient(
  must(process.env.VITE_SUPABASE_URL, "VITE_SUPABASE_URL"),
  must(process.env.SUPABASE_SERVICE_ROLE, "SUPABASE_SERVICE_ROLE") // service role here
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return res.status(405).send("Method not allowed");
    if (!req.headers["content-type"]?.includes("application/json")) {
      return res.status(400).json({ error: "bad_content_type" });
    }

    const { eventId, qty, email } = req.body ?? {};
    if (!eventId || !qty || !email) {
      return res.status(400).json({ error: "missing_fields", eventId: !!eventId, qty: !!qty, email: !!email });
    }

    // Load event & amount
    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select("id,title,price_rupees")
      .eq("id", eventId)
      .single();
    if (evErr || !ev) return res.status(404).json({ error: "event_not_found" });

    const price = Number(ev.price_rupees ?? 0);
    const quantity = Number(qty);
    if (!Number.isFinite(price) || price <= 0) return res.status(400).json({ error: "invalid_event_price", price });
    if (!Number.isFinite(quantity) || quantity < 1) return res.status(400).json({ error: "invalid_qty", qty });

    const amount_paise = price * quantity * 100;
    if (amount_paise < 100) return res.status(400).json({ error: "amount_too_low", amount_paise });

    // Razorpay keys (must be from same mode: both TEST or both LIVE)
    const key_id = must(process.env.VITE_RAZORPAY_KEY_ID, "VITE_RAZORPAY_KEY_ID");
    const key_secret = must(process.env.RAZORPAY_KEY_SECRET, "RAZORPAY_KEY_SECRET");
    const rzp = new Razorpay({ key_id, key_secret });

    // Create order
    let order;
    try {
      order = await rzp.orders.create({
        amount: amount_paise,
        currency: "INR",
        
        notes: { eventId: ev.id, qty: String(quantity), email }
      });
    } catch (e: any) {
      // EXTRACT A HUMAN MESSAGE
      const detail =
        e?.error?.description ||
        e?.error?.reason ||
        e?.description ||
        e?.message ||
        JSON.stringify(e);
      console.error("razorpay_create_failed:", e); // full object in Vercel logs
      return res.status(500).json({ error: "razorpay_create_failed", detail });
    }

    // Persist order
    const { data: ord, error: ordErr } = await supabase
      .from("orders")
      .insert({
        provider_order_id: order.id,
        email,
        qty: quantity,
        amount_paise,
        event_id: ev.id,
        status: "pending"
      })
      .select("id")
      .single();
    if (ordErr) return res.status(500).json({ error: "db_insert_failed", detail: ordErr.message || ordErr });

    return res.json({
      key: key_id,
      orderId: order.id,
      amount: order.amount,
      currency: "INR",
      localOrderId: ord.id,
      eventTitle: ev.title
    });
  } catch (e: any) {
    const msg = e?.message || String(e);
    if (msg.startsWith("env_missing:")) {
      return res.status(500).json({ error: "env_missing", name: msg.split(":")[1] });
    }
    console.error("checkout_start_fatal:", e);
    return res.status(500).json({ error: "server_error", detail: msg });
  }
}
