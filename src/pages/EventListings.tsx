import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { loadRazorpay } from "@/lib/loadRazorpay";

// Initialize Supabase
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

interface Event {
  id: string;
  title: string;
  city: string;
  venue: string;
  cover_url: string;
  price_rupees: number;
  starts_at: string;
  is_active: boolean;
}

export default function EventListings() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [email, setEmail] = useState("");
  const [qty, setQty] = useState(1);
  const [showBooking, setShowBooking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load all events
  useEffect(() => {
    const loadEvents = async () => {
      const { data, error } = await supabase
        .from("events")
        .select(
          "id, title, city, venue, cover_url, price_rupees, starts_at, is_active"
        )
        .order("starts_at", { ascending: true });

      if (error) {
        console.error("Error loading events:", error);
      } else {
        setEvents(data || []);
      }
    };
    loadEvents();
  }, []);

  function openBooking(event: Event) {
    setSelectedEvent(event);
    setShowBooking(true);
  }

  function closeBooking() {
    setShowBooking(false);
    setSelectedEvent(null);
    setEmail("");
    setQty(1);
  }

  // ✅ Razorpay Booking Flow
  async function handleBookingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEvent) return;

    try {
      setSubmitting(true);

      // 1️⃣ Create order on backend
      const resp = await fetch("/api/checkout/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          qty,
          email,
        }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.error("create-order failed:", resp.status, text);
        alert("Could not create order. Please try again.");
        setSubmitting(false);
        return;
      }

      const data = await resp.json();
      const key = data?.key;
      const orderId = data?.orderId;
      const amount = Number(data?.amount || 0);

      if (!key || !orderId || !amount || Number.isNaN(amount)) {
        console.error("Bad order payload:", data);
        alert("Order is incomplete. Please refresh and try again.");
        setSubmitting(false);
        return;
      }

      // 2️⃣ Load Razorpay SDK
      await loadRazorpay();
      const Razorpay = (window as any).Razorpay;
      if (!Razorpay) {
        alert("Could not load payment SDK. Try again.");
        setSubmitting(false);
        return;
      }

      // 3️⃣ Configure Razorpay Checkout
      const options = {
        key,
        order_id: orderId,
        amount,
        currency: "INR",
        name: "Stub+",
        description: selectedEvent.title || "Booking",
        prefill: { email },
        theme: { color: "#111827" },
        handler: function (resp: any) {
          const params = new URLSearchParams({
            order_id: data.localOrderId || "",
            rzp_order: orderId,
            rzp_payment: resp.razorpay_payment_id || "",
          });
          window.location.href = `/booking-confirmation?${params.toString()}`;
        },
        modal: {
          ondismiss: function () {
            console.warn("Checkout dismissed by user");
          },
        },
      };

      const rzp = new Razorpay(options);
      rzp.on("payment.failed", (err: any) => {
        console.error("Razorpay failed:", err?.error);
        alert(`Payment failed: ${err?.error?.description || "Cancelled/Failed"}`);
      });

      // 4️⃣ Open payment window
      rzp.open();
    } catch (err) {
      console.error("checkout crash:", err);
      alert("Something went wrong before opening Razorpay.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-6 text-center">Upcoming Events</h1>

        {events.length === 0 ? (
          <div className="text-center text-slate-500">No events available.</div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="rounded-xl bg-white shadow hover:shadow-md overflow-hidden transition"
              >
                <img
                  src={ev.cover_url || "/placeholder-cover.jpg"}
                  alt={ev.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg">
                    {ev.title || "Untitled Event"}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {ev.city} · {ev.venue || "TBA"}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    {ev.starts_at
                      ? new Date(ev.starts_at).toLocaleString()
                      : "Date TBA"}
                  </p>
                  <p className="mt-2 font-semibold">₹ {ev.price_rupees}</p>
                  <button
                    onClick={() => openBooking(ev)}
                    className="mt-3 px-4 py-2 rounded bg-black text-white hover:opacity-90 w-full"
                  >
                    Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ Booking Modal */}
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
              Payments are processed securely by Razorpay. You’ll be redirected
              to a confirmation page after payment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
