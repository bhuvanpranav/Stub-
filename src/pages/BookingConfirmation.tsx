// src/pages/BookingConfirmation.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import QRCode from "react-qr-code";
import { supabase } from "@/integrations/supabase/client"; // adjust path if your client lives elsewhere

type TicketRow = {
  id: string;
  status: string | null;
  order_id?: string | null;
  event_id?: string | null;
  owner_email?: string | null;
  wallet_address?: string | null;
  token_id?: number | null;
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

export default function BookingConfirmation(): JSX.Element {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id") || "";
  const [status, setStatus] = useState<string>("checking");
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [eventsMap, setEventsMap] = useState<Record<string, EventRow>>({});
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState<boolean>(true);

  // helper to fetch order status (calls your API that returns { status, tickets })
  async function fetchOrderStatus() {
    try {
      if (!orderId) {
        setError("Missing order id in URL.");
        setPolling(false);
        return;
      }
      const resp = await fetch(`/api/orders/status?orderId=${encodeURIComponent(orderId)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!resp.ok) {
        const body = await resp.text();
        console.error("orders/status error:", resp.status, body);
        setError(`Could not fetch order status (HTTP ${resp.status}).`);
        // keep polling a few times if server temporarily 404/500
        return;
      }

      const json = await resp.json();
      setStatus(json.status || "unknown");

      // If backend included tickets in response, use them. Otherwise try querying supabase directly.
      let foundTickets: TicketRow[] = [];

      if (Array.isArray(json.tickets) && json.tickets.length) {
        foundTickets = json.tickets;
      } else if (json.status === "paid") {
        // fallback: fetch tickets from supabase where order_id matches local order id
        // first get local order row id from orders table
        const { data: orders, error: oErr } = await supabase
          .from("orders")
          .select("id")
          .eq("provider_order_id", json.provider_order_id || orderId)
          .limit(1)
          .maybeSingle();

        if (oErr) {
          console.error("Could not find local order:", oErr);
        } else if (orders?.id) {
          const localOrderId = orders.id;
          const { data: tdata, error: tErr } = await supabase
            .from("tickets")
            .select("id,status,event_id,owner_email,wallet_address,token_id")
            .eq("order_id", localOrderId);
          if (tErr) {
            console.error("Could not fetch tickets from supabase:", tErr);
          } else {
            foundTickets = tdata || [];
          }
        } else {
          // direct attempt: look for tickets whose order provider id equals orderId (safety)
          const { data: tdata2, error: tErr2 } = await supabase
            .from("tickets")
            .select("id,status,event_id,owner_email,wallet_address,token_id")
            .eq("order_id", json.id || null);
          if (!tErr2) foundTickets = tdata2 || [];
        }
      }

      if (foundTickets.length) {
        setTickets(foundTickets);
        setPolling(false);
      }
    } catch (e: any) {
      console.error("fetchOrderStatus exception:", e);
      setError("An unexpected error occurred while fetching order status.");
    }
  }

  // Poll for order status until paid or tickets found
  useEffect(() => {
    let interval: any;
    if (!orderId) {
      setError("order_id missing from URL");
      return;
    }

    // initial fetch
    fetchOrderStatus();

    // keep polling while polling flag is true and we don't have tickets
    interval = setInterval(() => {
      if (!polling) return;
      fetchOrderStatus();
    }, 2500);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, polling]);

  // once we have tickets, fetch related events (batch)
  useEffect(() => {
    (async () => {
      if (!tickets?.length) return;
      const eventIds = Array.from(new Set(tickets.map((t) => t.event_id).filter(Boolean))) as string[];
      if (!eventIds.length) return;

      try {
        const { data: eventsData, error } = await supabase
          .from("events")
          .select("id,title,city,venue,cover_url,price_rupees,starts_at")
          .in("id", eventIds);
        if (error) {
          console.error("Failed to fetch events:", error);
        } else if (eventsData) {
          const map: Record<string, EventRow> = {};
          for (const ev of eventsData) map[ev.id] = ev;
          setEventsMap(map);
        }
      } catch (e) {
        console.error("Error fetching events:", e);
      }
    })();
  }, [tickets]);

  const formattedTickets = useMemo(() => tickets || [], [tickets]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="rounded-xl bg-card p-6">
        <h1 className="text-2xl font-bold">Booking Confirmation</h1>
        <div className="mt-3">
          <div>Order: <span className="font-mono">{orderId}</span></div>
          <div>Status: <strong>{status}</strong></div>
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-900/50 p-3 text-red-100">
            <strong>Error:</strong> {error}
          </div>
        )}

        {polling && !tickets.length && !error && (
          <div className="mt-6 text-sm text-muted-foreground">
            Checking payment status… this page will update once payment is complete.
          </div>
        )}

        {!polling && formattedTickets.length === 0 && !error && (
          <div className="mt-6 text-sm text-muted-foreground">
            Payment recorded but no tickets exist yet. If this persists, check the webhook logs or
            contact support.
          </div>
        )}

        {formattedTickets.length > 0 && (
          <div className="mt-6 space-y-4">
            {formattedTickets.map((t) => {
              const ev = t.event_id ? eventsMap[t.event_id] : undefined;
              const eventTitle = ev?.title || "Event";
              const venue = ev?.venue || "";
              const when = ev?.starts_at ? new Date(ev.starts_at).toLocaleString() : "TBA";

              // QR payload: simple URL to ticket page (you can change to signed payload if you prefer)
              const qrPayload = `${window.location.origin}/t/${t.id}`;

              return (
                <div key={t.id} className="rounded-lg border p-4 bg-black/40 flex gap-4 items-center">
                  <div style={{ width: 120, height: 120, display: "flex", alignItems: "center", justifyContent: "center", background: "white", borderRadius: 8 }}>
                    {/* Client-side QR avoids external image fetching and CSP issues */}
                    <QRCode value={qrPayload} size={110} />
                  </div>

                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">Ticket:</div>
                    <div className="font-mono">{t.id}</div>
                    <div className="mt-2">
                      <div className="font-semibold">{eventTitle}</div>
                      <div className="text-sm text-muted-foreground">{venue} · {when}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Status: {t.status}</div>
                      {t.owner_email && <div className="mt-1 text-xs">Owner: {t.owner_email}</div>}
                    </div>
                  </div>

                  <div className="text-right">
                    <a className="inline-block px-4 py-2 rounded bg-purple-600 text-white" href={`/t/${t.id}`} target="_blank" rel="noreferrer">Open Ticket</a>
                    <div className="mt-2 text-xs text-muted-foreground">QR refreshes on server (if enabled)</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6">
          <Link to="/events" className="text-sm text-purple-400">Back to Events</Link>
        </div>
      </div>
    </div>
  );
}
