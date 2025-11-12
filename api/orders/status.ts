// api/orders/status.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!; // server-only

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { orderId, rzpOrderId, rzpOrder } = req.query as Record<string, string | undefined>;

    if (!orderId && !rzpOrderId && !rzpOrder) {
      return res.status(400).json({ error: "missing_order_id", message: "Provide orderId or rzpOrderId as query param." });
    }

    const providerOrderId = rzpOrderId || rzpOrder;

    let order;
    if (orderId) {
      const { data, error } = await supabase.from("orders").select("id,provider_order_id,status").eq("id", orderId).limit(1).maybeSingle();
      if (error) {
        console.error("supabase lookup by id error:", error);
        return res.status(500).json({ error: "db_error", detail: error.message || error });
      }
      order = data;
    } else {
      const { data, error } = await supabase.from("orders").select("id,provider_order_id,status").eq("provider_order_id", providerOrderId).limit(1).maybeSingle();
      if (error) {
        console.error("supabase lookup by provider_order_id error:", error);
        return res.status(500).json({ error: "db_error", detail: error.message || error });
      }
      order = data;
    }

    if (!order) return res.status(404).json({ error: "order_not_found" });

    let tickets: any[] = [];
    if (order.status === "paid") {
      const { data: tdata, error: terr } = await supabase.from("tickets").select("id,status,order_id").eq("order_id", order.id);
      if (terr) console.error("supabase tickets error:", terr);
      else tickets = tdata || [];
    }

    return res.json({ status: order.status || "pending", provider_order_id: order.provider_order_id, tickets });
  } catch (err: any) {
    console.error("orders/status handler error:", err);
    return res.status(500).json({ error: "server_error", detail: String(err) });
  }
}
