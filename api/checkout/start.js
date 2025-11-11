import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";
const must = (v, name) => {
    if (!v)
        throw new Error(`env_missing:${name}`);
    return v;
};
const supabase = createClient(must(process.env.VITE_SUPABASE_URL, "VITE_SUPABASE_URL"), must(process.env.SUPABASE_SERVICE_ROLE, "SUPABASE_SERVICE_ROLE") // ✅ service role (not anon)
);
export default async function handler(req, res) {
    try {
        if (req.method !== "POST")
            return res.status(405).send("Method not allowed");
        if (req.headers["content-type"]?.includes("application/json") !== true) {
            return res.status(400).json({ error: "bad_content_type", need: "application/json" });
        }
        const body = req.body || {};
        const eventId = body.eventId;
        const qty = Number(body.qty);
        const email = body.email;
        if (!eventId || !qty || !email) {
            return res.status(400).json({ error: "missing_fields", fields: { eventId: !!eventId, qty: !!qty, email: !!email } });
        }
        // 1) Event lookup
        const { data: ev, error: evErr } = await supabase
            .from("events")
            .select("id, title, price_rupees")
            .eq("id", eventId)
            .single();
        if (evErr || !ev) {
            console.error("event_not_found:", evErr);
            return res.status(404).json({ error: "event_not_found", eventId });
        }
        const price = Number(ev.price_rupees ?? 0);
        if (!Number.isFinite(price) || price <= 0) {
            return res.status(400).json({ error: "invalid_event_price", price_rupees: ev.price_rupees });
        }
        if (!Number.isFinite(qty) || qty < 1) {
            return res.status(400).json({ error: "invalid_qty", qty });
        }
        const amount_paise = price * qty * 100;
        if (amount_paise < 100) { // Razorpay minimum = ₹1.00 = 100 paise
            return res.status(400).json({ error: "amount_too_low", amount_paise });
        }
        // 2) Razorpay order
        const key_id = must(process.env.VITE_RAZORPAY_KEY_ID, "VITE_RAZORPAY_KEY_ID");
        const key_secret = must(process.env.RAZORPAY_KEY_SECRET, "RAZORPAY_KEY_SECRET");
        const rzp = new Razorpay({ key_id, key_secret });
        let order;
        try {
            order = await rzp.orders.create({
                amount: amount_paise,
                currency: "INR",
                receipt: `evt_${ev.id}_${Date.now()}`,
                notes: { eventId: ev.id, qty: String(qty), email },
            });
        }
        catch (e) {
            console.error("razorpay_create_failed:", e?.message || e);
            return res.status(500).json({ error: "razorpay_create_failed", detail: e?.message || String(e) });
        }
        // 3) DB insert (use service role to bypass RLS)
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
            console.error("db_insert_failed:", ordErr);
            return res.status(500).json({ error: "db_insert_failed", detail: ordErr.message || ordErr });
        }
        return res.json({
            key: key_id,
            orderId: order.id,
            amount: order.amount,
            currency: "INR",
            localOrderId: ord.id,
            eventTitle: ev.title,
        });
    }
    catch (e) {
        const msg = e?.message || String(e);
        console.error("checkout_start_fatal:", msg);
        if (msg.startsWith("env_missing:")) {
            const name = msg.split(":")[1];
            return res.status(500).json({ error: "env_missing", name });
        }
        return res.status(500).json({ error: "server_error", detail: msg });
    }
}
