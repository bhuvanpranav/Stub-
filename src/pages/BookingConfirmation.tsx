import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import QRCode from "react-qr-code";
import { supabase } from "@/integrations/supabase/client";

type TicketRow = {
  id: string;
  status: string | null;
  order_id?: string | null;
  event_id?: string | null;
  owner_email?: string | null;
};

type EventRow = {
  id: string;
  title?: string | null;
  city?: string | null;
  venue?: string | null;
  cover_url?: string | null;
  price_rupees?: number | null;
  starts_at?: string | null;
};

export default function BookingConfirmation() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id") || "";
  const [status, setStatus] = useState<string>("checking");
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [eventsMap, setEventsMap] = useState<Record<string, EventRow>>({});
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState<boolean>(true);

  async function fetchOrderStatus() {
    try {
      if (!orderId) return;
      const resp = await fetch(`/api/orders/status?orderId=${orderId}`);
      if (!resp.ok) {
        console.error("status failed:", resp.status);
        return;
      }
      const json = await resp.json();
      setStatus(json.status);
      if (json.tickets?.length) {
        setTickets(json.tickets);
        setPolling(false);
      }
    } catch (e) {
      console.error("error fetching order status:", e);
    }
  }

  useEffect(() => {
    fetchOrderStatus();
    const timer = setInterval(() => {
      if (polling) fetchOrderStatus();
    }, 3000);
    return () => clearInterval(timer);
  }, [orderId, polling]);

  useEffect(() => {
    (async () => {
      if (!tickets.length) return;
      const eventIds = Array.from(new Set(tickets.map(t => t.event_id).filter(Boolean))) as string[];
      if (!eventIds.length) return;
      const { data: events } = await supabase
        .from("events")
        .select("id,title,city,venue,price_rupees,starts_at")
        .in("id", eventIds);
      const map: Record<string, EventRow> = {};
      events?.forEach(ev => (map[ev.id] = ev));
      setEventsMap(map);
    })();
  }, [tickets]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="rounded-xl bg-card p-6">
        <h1 className="text-2xl font-bold">Booking Confirmation</h1>
        <div className="mt-3">
          <div>Order: <span className="font-mono">{orderId}</span></div>
          <div>Status: <strong>{status}</strong></div>
        </div>

        {tickets.length > 0 && (
          <div className="mt-6 space-y-4">
            {tickets.map(ticket => {
              const ev = ticket.event_id ? eventsMap[ticket.event_id] : undefined;
              const qrPayload = `${window.location.origin}/t/${ticket.id}`;
              return (
                <div key={ticket.id} className="rounded-lg border p-4 bg-black/40 flex gap-4 items-center">
                  <div style={{ width: 120, height: 120, background: "white", padding: 4, borderRadius: 8 }}>
                    <QRCode value={qrPayload} size={110} />
                  </div>

                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">Ticket:</div>
                    <div className="font-mono">{ticket.id}</div>
                    <div className="mt-2">
                      <div className="font-semibold">{ev?.title || "Event"}</div>
                      <div className="text-sm text-muted-foreground">
                        {ev?.venue || "TBA"} ·{" "}
                        {ev?.starts_at
                          ? new Date(ev.starts_at).toLocaleString()
                          : "TBA"}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Status: {ticket.status}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <a
                      href={`/t/${ticket.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block px-4 py-2 rounded bg-purple-600 text-white"
                    >
                      Open Ticket
                    </a>
                    <div className="mt-2 text-xs text-muted-foreground">
                      QR refreshes on server (if enabled)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!tickets.length && (
          <div className="mt-6 text-sm text-muted-foreground">
            Waiting for tickets to be created. Please wait a moment...
          </div>
        )}

        <div className="mt-6">
          <Link to="/events" className="text-sm text-purple-400">
            Back to Events
          </Link>
        </div>
      </div>
    </div>
  );
}
