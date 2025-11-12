// src/pages/BookingConfirmation.tsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function BookingConfirmation() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id") || "";
  const rzp_order = searchParams.get("rzp_order") || "";
  const [status, setStatus] = useState<string | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!orderId && !rzp_order) {
      setError("No order information provided.");
      setPolling(false);
      return;
    }

    let cancelled = false;
    async function checkStatus() {
      try {
        const url = `/api/orders/status?${orderId ? "orderId=" + encodeURIComponent(orderId) : "rzpOrder=" + encodeURIComponent(rzp_order)}`;
        const resp = await fetch(url);
        if (!resp.ok) {
          const text = await resp.text();
          console.warn("status fetch failed:", resp.status, text);
          setError("Could not fetch order status yet.");
          return;
        }
        const data = await resp.json();
        setStatus(data.status);
        setTickets(data.tickets || []);
        if (data.status === "paid") {
          setPolling(false);
        }
      } catch (e: any) {
        console.error("status check error:", e);
        setError("Network error while checking order.");
      }
    }

    checkStatus(); // first call
    const id = setInterval(() => {
      if (!cancelled && polling) checkStatus();
    }, 2000); // poll every 2s

    return () => { cancelled = true; clearInterval(id); };
  }, [orderId, rzp_order, polling]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto bg-card rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-2">Booking Confirmation</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div className="mb-4">
          <div>Order: <strong>{orderId || rzp_order}</strong></div>
          <div>Status: <strong>{status || "Checking..."}</strong></div>
        </div>

        {status === "paid" && tickets.length === 0 && (
          <p className="text-muted-foreground">Tickets are being created. Please wait a moment.</p>
        )}

        {status === "paid" && tickets.length > 0 && (
          <div className="space-y-4">
            {tickets.map((t) => (
              <div key={t.id} className="rounded-md border p-4 bg-muted/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Ticket: {t.id}</div>
                    <div className="text-sm text-muted-foreground">Status: {t.status}</div>
                  </div>
                  <div>
                    {/* fetch a rotating QR from server */}
                    <img alt="ticket-qr" src={`/api/ticket/qr?ticketId=${encodeURIComponent(t.id)}`} style={{ width: 160, height: 160 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6">
          <a href="/events" className="text-primary underline">Back to Events</a>
        </div>
      </div>
    </div>
  );
}
