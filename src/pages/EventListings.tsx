// src/pages/EventListings.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    Razorpay: any;
  }
}

/** Load Razorpay SDK once */
let razorpayLoaded = false;
const loadRazorpay = () =>
  new Promise<boolean>((resolve) => {
    if (window.Razorpay || razorpayLoaded) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => {
      razorpayLoaded = true;
      resolve(true);
    };
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

type EventRow = {
  id: string;
  title?: string | null;
  city?: string | null;
  venue?: string | null;
  cover_url?: string | null;
  price_rupees?: number | null;
  starts_at?: string | null; // ISO
  is_active?: boolean | null;
  created_at?: string | null;
};

export default function EventListings() {
  const { city } = useParams(); // supports /events/:city/:category
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  // booking state
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);
  const [email, setEmail] = useState("");
  const [qty, setQty] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    (async () => {
      // explicit columns to avoid 400s on unknown fields
      let q = supabase
        .from("events")
        .select(
          "id,title,city,venue,cover_url,price_rupees,starts_at,is_active,created_at"
        );

      // ✅ case-insensitive city match (fixes bengaluru vs Bengaluru)
      if (city) q = q.ilike("city", city);

      const { data, error } = await q
        .order("starts_at", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) console.error("Events load error:", error);
      console.log("Loaded events:", data, "Error:", error);

      setEvents(data || []);
      setLoading(false);
    })();
  }, [city]);

  function openBooking(ev: EventRow) {
    setSelectedEvent(ev);
    setQty(1);
    setShowBooking(true);
  }
  function closeBooking() {
    setShowBooking(false);
    setSelectedEvent(null);
    setSubmitting(false);
  }

  async function handleBookingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEvent) return;

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      alert("Please enter a valid email.");
      return;
    }
    if (qty < 1) {
      alert("Quantity must be at least 1.");
      return;
    }

    setSubmitting(true);
    const ok = await loadRazorpay();
    if (!ok) {
      alert("Failed to load payment gateway");
      setSubmitting(false);
      return;
    }

    try {
      // your API must exist (via vercel dev or deployed)
      const startRes = await fetch("/api/checkout/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEvent.id, qty, email }),
      });

      if (!startRes.ok) {
        alert("Could not create order. Please try again.");
        setSubmitting(false);
        return;
      }

      const startData = (await startRes.json()) as {
        key: string;
        orderId: string;
        amount: number;
        currency: string;
        localOrderId: string;
      };

      const rzp = new window.Razorpay({
        key: startData.key || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: startData.amount,
        currency: startData.currency || "INR",
        name: "Stub+",
        description: `${qty} ticket(s) for ${selectedEvent.title || "Event"}`,
        order_id: startData.orderId,
        prefill: { email },
        handler: (response: any) => {
          window.location.href = `/booking-confirmation?order_id=${encodeURIComponent(
            startData.localOrderId
          )}&rzp_order=${encodeURIComponent(
            startData.orderId
          )}&payment_id=${encodeURIComponent(
            response.razorpay_payment_id
          )}`;
        },
        theme: { color: "#1e293b" },
      });

      rzp.open();
      setSubmitting(false);
      setShowBooking(false);
    } catch (err) {
      console.error(err);
      alert("Something went wrong while starting the payment.");
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-6">Loading events…</div>;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold mb-4">Events</h1>

      {/* Events grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((ev) => {
          const title = ev.title || "Untitled Event";
          const img = ev.cover_url || "/placeholder-cover.jpg"; // add this file under /public
          const c = ev.city || "—";
          const v = ev.venue ? ` · ${ev.venue}` : "";
          const when = ev.starts_at
            ? new Date(ev.starts_at).toLocaleString()
            : "TBA";
          const price = Number(ev.price_rupees ?? 0);

          return (
            <div
              key={ev.id}
              className="rounded-xl border overflow-hidden bg-[#0B0B0D] text-white/90"
            >
              <img
                src={img}
                alt={title}
                className="w-full h-40 object-cover bg-slate-100"
              />
              <div className="p-4">
                <div className="font-semibold">{title}</div>
                <div className="text-sm text-slate-400">
                  {c}
                  {v} · {when}
                </div>
                <div className="mt-2 text-lg">₹ {price}</div>
                <button
                  className="mt-3 px-4 py-2 rounded bg-black text-white hover:opacity-90"
                  onClick={() => openBooking(ev)}
                >
                  Book
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking modal */}
      {showBooking && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="modal bg-white w-full max-w-md rounded-xl p-5 shadow-xl text-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Book: {selectedEvent.title || "Event"}
              </h2>
              <button
                className="text-slate-500 hover:text-slate-700"
                onClick={closeBooking}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  className="mt-1 w-full rounded px-3 py-2 bg-white text-slate-900 placeholder-slate-500 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Quantity</label>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded px-3 py-2 bg-white text-slate-900 placeholder-slate-500 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  value={qty}
                  onChange={(e) =>
                    setQty(Math.max(1, Number(e.target.value || 1)))
                  }
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-slate-700">
                  Total:{" "}
                  <span className="font-semibold">
                    ₹ {Number(selectedEvent.price_rupees ?? 0) * qty}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded border"
                    onClick={closeBooking}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-black text-white hover:opacity-90 disabled:opacity-60"
                    disabled={submitting}
                  >
                    {submitting ? "Processing…" : "Proceed to Pay"}
                  </button>
                </div>
              </div>
            </form>

            <p className="text-xs text-slate-500 mt-3">
              Payments are processed securely by Razorpay. You will be
              redirected to a confirmation page after payment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
