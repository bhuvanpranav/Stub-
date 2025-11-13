// src/pages/EventListings.tsx
import React, { useEffect, useState } from "react";
import { getSupabaseClient } from "@/integrations/supabase/client";

const supabase = getSupabaseClient();

type EventItem = {
  id: string;
  title: string;
  city?: string;
  date?: string;
  price?: number;
};

export default function EventListings() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  // previously broken initialization (useState(f) etc) — set a safe default
  const [showBooking, setShowBooking] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        // Attempt to fetch from Supabase; if using mock client this returns []
        const resp: any = await supabase.from("events").select("*");
        if (!mounted) return;
        const data = resp?.data ?? [];
        setEvents(
          data.length > 0
            ? data.map((d: any) => ({
                id: d.id,
                title: d.title,
                city: d.city,
                date: d.date,
                price: d.price,
              }))
            : // fallback sample events so the UI isn't empty during dev
              [
                { id: "1", title: "Indie Night — Mumbai", city: "Mumbai", date: "2025-12-05", price: 499 },
                { id: "2", title: "EDM Rave — Bangalore", city: "Bangalore", date: "2026-01-15", price: 999 },
              ]
        );
      } catch (err) {
        console.error("Failed to load events", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  function openBooking(e: EventItem) {
    setSelectedEvent(e);
    setShowBooking(true);
  }

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 6px 18px rgba(10,10,10,0.06)" }}>
        <h2>Events</h2>
        {loading ? (
          <p>Loading events...</p>
        ) : (
          <ul>
            {events.map((ev) => (
              <li key={ev.id} style={{ marginBottom: 12 }}>
                <strong>{ev.title}</strong> — {ev.city} ({ev.date}) — ₹{ev.price ?? "TBD"}
                <div style={{ marginTop: 6 }}>
                  <button onClick={() => openBooking(ev)}>Book</button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {showBooking && selectedEvent && (
          <div style={{ marginTop: 16 }}>
            <h3>Checkout — {selectedEvent.title}</h3>
            <p>Price: ₹{selectedEvent.price}</p>
            <p><em>Note: real checkout requires Razorpay keys and server order creation.</em></p>
            <button onClick={() => { setShowBooking(false); setSelectedEvent(null); }}>Close</button>
          </div>
        )}
      </div>
    </main>
  );
}
