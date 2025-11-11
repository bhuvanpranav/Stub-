import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
export default async function handler(req, res) {
    try {
        const { orderId, rzpOrderId } = req.query;
        if (!orderId && !rzpOrderId)
            return res.status(400).json({ error: "missing_id" });
        const q = supabase.from("orders").select("id,status,provider_order_id");
        const { data: orders, error } = orderId
            ? await q.eq("id", orderId)
            : await q.eq("provider_order_id", rzpOrderId);
        if (error || !orders?.length)
            return res.status(404).json({ error: "not_found" });
        const order = orders[0];
        let tickets = [];
        if (order.status === "paid") {
            const t = await supabase.from("tickets").select("id").eq("order_id", order.id);
            tickets = t.data || [];
        }
        return res.json({ status: order.status, tickets });
    }
    catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
