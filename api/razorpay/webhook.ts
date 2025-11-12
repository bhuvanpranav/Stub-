// /api/razorpay/webhook.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: false } };
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!);

function rawBody(req: VercelRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return res.status(405).send("Method not allowed");
    const body = await rawBody(req);
    const signature = req.headers["x-razorpay-signature"] as string | undefined;
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!).update(body).digest("hex");
    if (!signature || signature !== expected) return res.status(401).send("invalid_signature");

    const event = JSON.parse(body);
    if (event.event !== "payment.captured" && event.event !== "payment.authorized") {
      return res.json({ ok: true });
    }

    const payment = event.payload.payment.entity;
    const rzpOrderId = payment.order_id;
    const paymentId = payment.id;

    const { data: order } = await supabase.from("orders").select("*").eq("provider_order_id", rzpOrderId).single();
    if (!order) return res.status(404).json({ ok: false, reason: "order_not_found" });

    await supabase.from("orders").update({ status: "paid", provider_payment_id: paymentId, updated_at: new Date().toISOString() }).eq("id", order.id);

    // Create tickets (ensure columns exist)
    const tickets = Array.from({ length: order.qty }).map(() => ({
      order_id: order.id,
      event_id: order.event_id,
      owner_email: order.email || null,
      status: "active",
      created_at: new Date().toISOString()
    }));

    const { error: tErr } = await supabase.from("tickets").insert(tickets);
    if (tErr) {
      console.error("ticket insert failed", tErr);
      return res.status(500).json({ ok: false, reason: "ticket_insert_failed", detail: tErr });
    }

    return res.json({ ok: true, status: "paid", provider_order_id: rzpOrderId, ticketsInserted: tickets.length });
  } catch (e: any) {
    console.error("webhook error", e);
    return res.status(500).json({ ok: false, reason: e.message });
  }
}
