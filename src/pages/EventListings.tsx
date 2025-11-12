// src/pages/EventListings.tsx
import { loadRazorpay } from "@/lib/loadRazorpay";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Ticket } from "lucide-react";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
// paste INSIDE the component function, near top (above handlers)
const [email, setEmail] = useState<string>("");
const [qty, setQty] = useState<number>(1);
const [submitting, setSubmitting] = useState<boolean>(false);
const [selectedEvent, setSelectedEvent] = useState<any | null>(null); // replace `any` with your Event type if you have one

/**
 * Defensive Razorpay loader that returns true if loaded
 */
async function loadRazorpaySDK(): Promise<boolean> {
  if ((window as any).Razorpay) return true;
  return new Promise((resolve) => {
    try {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    } catch (e) {
      resolve(false);
    }
  });
}

const EventListings = () => {
  const { city, type } = useParams<{ city: string; type: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [numberOfTickets, setNumberOfTickets] = useState(1);
  const [bookingForms, setBookingForms] = useState([{
    name: "",
    age: "",
    email: "",
    phone: "",
    address: "",
    sex: ""
  }]);
  const [submitting, setSubmitting] = useState(false);

  // Demo local events (you can replace this with Supabase query later)
  const allEvents = [
    {
      id: "2bf3af93-34ea-4242-86ea-474e2bcb5f20",
      title: "Demo Party",
      date: "2025-11-13T20:00:00Z",
      location: "Koramangala",
      type: "party",
      city: "bengaluru",
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop",
      price_rupees: 499,
      price_display: "₹ 499"
    },
    // ... add more if you want
  ];

  const filteredEvents = allEvents.filter(event =>
    (!city || event.city === city?.toLowerCase()) &&
    (!type || event.type === type?.toLowerCase()) &&
    (searchQuery === "" || event.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleBookNow = (event: any) => {
    setSelectedEvent(event);
    setNumberOfTickets(1);
    setBookingForms([{
      name: "",
      age: "",
      email: "",
      phone: "",
      address: "",
      sex: ""
    }]);
    setBookingDialogOpen(true);
  };

  const handleTicketNumberChange = (num: number) => {
    setNumberOfTickets(num);
    const newForms = Array.from({ length: num }).map((_, index) => bookingForms[index] || {
      name: "",
      age: "",
      email: "",
      phone: "",
      address: "",
      sex: ""
    });
    setBookingForms(newForms);
  };

  const updateBookingForm = (index: number, field: string, value: string) => {
    const updatedForms = [...bookingForms];
    updatedForms[index] = { ...updatedForms[index], [field]: value };
    setBookingForms(updatedForms);
  };

 async function handleBookingSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!selectedEvent) return;

  try {
    setSubmitting(true);

    // 1️⃣ Call backend to create order
    const resp = await fetch("/api/checkout/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: selectedEvent.id,
        qty,
        email,
      }),
    });

    const text = await resp.text();

    if (!resp.ok) {
      console.error("create-order failed:", resp.status, text);
      alert("Could not create order. Please try again.");
      setSubmitting(false);
      return;
    }

    const data = JSON.parse(text);
    const key = data.key;
    const orderId = data.orderId;
    const amount = Number(data.amount);

    if (!key || !orderId || isNaN(amount)) {
      console.error("bad payload", data);
      alert("Bad order data from server.");
      setSubmitting(false);
      return;
    }

    // 2️⃣ Load Razorpay script
    await loadRazorpay();
    const Razorpay = (window as any).Razorpay;

    if (!Razorpay) {
      alert("Could not load payment SDK. Check your internet connection and try again.");
      setSubmitting(false);
      return;
    }

    // 3️⃣ Create checkout
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

    rzp.open();
  } catch (err) {
    console.error("checkout crash", err);
    alert("Something went wrong while opening the payment window.");
  } finally {
    setSubmitting(false);
  }
}


  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="relative py-16">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto text-center mb-8">
            <h1 className="text-4xl font-bold capitalize">{type || "Events"} in {city || "your city"}</h1>
            <p className="text-muted-foreground mt-2">Discover events near you.</p>
          </div>

          <div className="max-w-2xl mx-auto mb-8">
            <Input placeholder="Search events..." className="h-12" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.length === 0 && (
              <div className="col-span-full text-center py-20 text-muted-foreground">No events found.</div>
            )}
            {filteredEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                <div className="aspect-video relative overflow-hidden bg-slate-100">
                  <img src={event.image} alt={event.title} className="object-cover w-full h-full" />
                  <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 rounded-md text-sm">
                    {event.price_display || `₹ ${event.price_rupees}`}
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" /> <span>{new Date(event.date).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" /> <span>{event.location}</span>
                  </div>
                </CardContent>
                <CardContent className="pt-0">
                  <Button className="w-full" onClick={() => handleBookNow(event)}>
                    <Ticket className="w-4 h-4 mr-2" /> Book Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Book Your Tickets</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleBookingSubmit} className="space-y-6 mt-4">
            <div>
              <Label htmlFor="numberOfTickets">Number of Tickets</Label>
              <Select value={numberOfTickets.toString()} onValueChange={(v) => handleTicketNumberChange(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select number" />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n} {n===1 ? "Ticket":"Tickets"}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {bookingForms.map((form, i) => (
              <div key={i} className="p-4 rounded-md border bg-muted/10">
                <h4 className="font-semibold mb-3">Attendee {i+1}</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`name-${i}`}>Full Name</Label>
                    <Input id={`name-${i}`} required value={form.name} onChange={(e) => updateBookingForm(i,"name", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor={`age-${i}`}>Age</Label>
                    <Input id={`age-${i}`} type="number" required value={form.age} onChange={(e)=> updateBookingForm(i,"age", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor={`email-${i}`}>Email</Label>
                    <Input id={`email-${i}`} type="email" required value={form.email} onChange={(e)=> updateBookingForm(i,"email", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor={`phone-${i}`}>Phone</Label>
                    <Input id={`phone-${i}`} required value={form.phone} onChange={(e)=> updateBookingForm(i,"phone", e.target.value)} />
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span>Price per ticket</span>
                <strong>{selectedEvent?.price_display || `₹${selectedEvent?.price_rupees ?? 0}`}</strong>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span>Total</span>
                <strong>₹{(Number(selectedEvent?.price_rupees || 0) * numberOfTickets).toLocaleString('en-IN')}</strong>
              </div>

              <div className="mt-4 flex gap-3">
                <Button type="button" variant="ghost" onClick={() => setBookingDialogOpen(false)} disabled={submitting}>Cancel</Button>
                <Button type="submit" className="ml-auto" disabled={submitting}>{submitting ? "Processing..." : "Proceed to Payment"}</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default EventListings;
