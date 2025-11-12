// /api/orders/status.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_PUBLISHABLE_KEY!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { orderId, rzpOrderId } = req.query as { orderId?: string; rzpOrderId?: string };
    if (!orderId && !rzpOrderId) return res.status(400).json({ error: "missing_id" });

    const { data: orders } = await supabase
      .from("orders")
      .select("id,status,provider_order_id")
      .or(orderId ? `id.eq.${orderId}` : `provider_order_id.eq.${rzpOrderId}`);

    if (!orders || !orders.length) return res.status(404).json({ error: "not_found" });

    const order = orders[0];
    let tickets: any[] = [];
    if (order.status === "paid") {
      const t = await supabase.from("tickets").select("id,event_id,owner_email,status").eq("order_id", order.id);
      tickets = t.data || [];
    }
    return res.json({ status: order.status, tickets });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
