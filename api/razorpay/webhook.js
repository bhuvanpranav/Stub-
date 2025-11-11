import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
export const config = { api: { bodyParser: false } };
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
function rawBody(req) {
    return new Promise((resolve, reject) => {
        let data = "";
        req.on("data", c => data += c);
        req.on("end", () => resolve(data));
        req.on("error", reject);
    });
}
export default async function handler(req, res) {
    try {
        const body = await rawBody(req);
        const sig = req.headers["x-razorpay-signature"];
        const expected = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(body).digest("hex");
        if (sig !== expected)
            return res.status(401).send("bad_sig");
        const event = JSON.parse(body);
        if (event.event !== "payment.captured")
            return res.json({ ok: true });
        const payment = event.payload.payment.entity;
        const rzpOrderId = payment.order_id;
        const paymentId = payment.id;
        const { data: order, error } = await supabase
            .from("orders").select("*").eq("provider_order_id", rzpOrderId).single();
        if (error || !order)
            return res.status(404).json({ ok: false, reason: "order_not_found" });
        await supabase.from("orders")
            .update({ status: "paid", provider_payment_id: paymentId, updated_at: new Date().toISOString() })
            .eq("id", order.id);
        const tickets = Array.from({ length: order.qty }).map(() => ({
            order_id: order.id,
            event_id: order.event_id,
            owner_email: order.email,
            status: "active"
        }));
        const { error: tErr } = await supabase.from("tickets").insert(tickets);
        if (tErr)
            return res.status(500).json({ ok: false, reason: "ticket_insert_failed" });
        return res.json({ ok: true });
    }
    catch (e) {
        return res.status(500).json({ ok: false, reason: e.message });
    }
}
