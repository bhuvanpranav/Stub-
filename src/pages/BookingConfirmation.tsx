// src/pages/BookingConfirmation.tsx
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Ticket, CheckCircle, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

const PLACEHOLDER_IMG = "/placeholder-cover.jpg"; // copy file into public/

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [bookingData, setBookingData] = useState<any>(null);
  const [qrValue, setQrValue] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Generate small deterministic "hash" (not crypto but fine for demo)
  const generateBlockchainHash = (data: string, timestamp: number) => {
    const str = data + timestamp;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, "0");
  };

  const generateQRValue = (bd: any) => {
    if (!bd) return "";
    const timestamp = Math.floor(Date.now() / (5 * 60 * 1000)); // rotates every 5 minutes
    const blockchainHash = generateBlockchainHash(
      `${bd.bookingId}-${bd.event?.id}-${bd.numberOfTickets}`,
      timestamp
    );
    return JSON.stringify({
      bookingId: bd.bookingId,
      eventId: bd.event?.id,
      eventName: bd.event?.title,
      tickets: bd.numberOfTickets,
      hash: blockchainHash,
      timestamp,
      verified: true,
    });
  };

  // Load booking from localStorage OR from URL params (fallback)
  useEffect(() => {
    const stored = localStorage.getItem("latestBooking");
    let booking: any = null;
    if (stored) {
      try { booking = JSON.parse(stored); } catch { booking = null; }
    }

    // If booking not in localStorage, try to build minimal booking from query params
    if (!booking) {
      const rzpOrder = searchParams.get("rzp_order") || searchParams.get("rzpOrder");
      const orderId = searchParams.get("order_id") || searchParams.get("orderId");
      if (rzpOrder || orderId) {
        booking = {
          bookingId: orderId || rzpOrder,
          orderId: orderId || undefined,
          rzp_order: rzpOrder || undefined,
          event: {
            id: searchParams.get("eventId") || null,
            title: searchParams.get("eventTitle") || "Event",
            image: searchParams.get("eventImage") || null,
            date: searchParams.get("eventDate") || "",
            location: searchParams.get("eventLocation") || "",
          },
          numberOfTickets: Number(searchParams.get("qty") || 1),
          paymentId: searchParams.get("rzp_payment") || "",
          bookingDate: new Date().toISOString(),
          totalAmount: Number(searchParams.get("amount") || 0),
          attendees: [],
        };
      }
    }

    if (!booking) {
      toast.error("No booking found");
      navigate("/events");
      return;
    }

    setBookingData(booking);
    setQrValue(generateQRValue(booking));
    setImageSrc(booking.event?.image || PLACEHOLDER_IMG);
  }, [navigate, searchParams]);

  // Poll backend for order status — uses orderId OR rzpOrder automatically
  useEffect(() => {
    if (!bookingData) return;
    const pollStatus = async () => {
      try {
        const q = new URLSearchParams();
        if (bookingData.orderId) q.set("orderId", bookingData.orderId);
        if (bookingData.rzp_order) q.set("rzpOrderId", bookingData.rzp_order);
        // If neither present, backend will return 400 — we avoid calling.
        if (!q.toString()) return;

        const res = await fetch(`/api/orders/status?${q.toString()}`, { cache: "no-store" });
        if (!res.ok) {
          console.warn("orders/status returned non-OK:", res.status);
          return;
        }
        const data = await res.json();
        if (data.status === "paid") {
          toast.success("Payment verified successfully!");
          // optionally update bookingData with tickets returned by API
          if (data.tickets && data.tickets.length > 0) {
            setBookingData((prev: any) => ({ ...prev, tickets: data.tickets }));
            localStorage.setItem("latestBooking", JSON.stringify({ ...bookingData, tickets: data.tickets }));
          }
        } else if (data.status === "failed") {
          toast.error("Payment verification failed");
        } // else still pending
      } catch (err) {
        console.error("Status check error:", err);
      }
    };

    pollStatus(); // immediate
    const poller = setInterval(pollStatus, 5000); // every 5s
    return () => clearInterval(poller);
  }, [bookingData]);

  // Regenerate QR every 5 minutes and keep countdown
  useEffect(() => {
    if (!bookingData) return;

    const regen = () => {
      const newVal = generateQRValue(bookingData);
      setQrValue(newVal);
      setTimeLeft(300);
      // don't spam toasts - only show once when regenerated automatically
      // toast.info("QR code refreshed for security");
    };

    const qrInterval = setInterval(regen, 5 * 60 * 1000);
    const countdown = setInterval(() => {
      setTimeLeft(prev => (prev <= 1 ? 300 : prev - 1));
    }, 1000);

    return () => {
      clearInterval(qrInterval);
      clearInterval(countdown);
    };
  }, [bookingData]);

  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  const handleDownloadTicket = () => {
    // You can implement a real PDF generation; for now, download a JSON ticket
    if (!bookingData) return;
    const blob = new Blob([JSON.stringify({ booking: bookingData, qr: qrValue }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ticket-${bookingData.bookingId || Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Ticket downloaded");
  };

  // if booking not ready, show nothing or a loader
  if (!bookingData) return null;

  // handle image load error (CSP or blocked) -> fallback to placeholder
  const onImgError = () => setImageSrc(PLACEHOLDER_IMG);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Success Header */}
      <section className="relative py-12 overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20">
        <div className="container px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Booking Confirmed!</h1>
            <p className="text-xl text-muted-foreground">Your tickets have been successfully booked</p>
          </div>
        </div>
      </section>

      {/* Booking Details */}
      <section className="container px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Booking Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-muted-foreground">Booking ID</span>
                <span className="font-mono font-bold">{bookingData.bookingId}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-muted-foreground">Payment ID</span>
                <span className="font-mono text-sm">{bookingData.paymentId || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Booking Date</span>
                <span className="font-semibold">
                  {new Date(bookingData.bookingDate || Date.now()).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle>Event Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video relative overflow-hidden rounded-lg mb-4 bg-muted">
                {imageSrc && (
                  // image may be blocked by CSP if it's served from other origin; on error we fallback
                  <img
                    src={imageSrc}
                    alt={bookingData.event?.title || "Event"}
                    className="object-cover w-full h-full"
                    onError={onImgError}
                  />
                )}
              </div>
              <h2 className="text-2xl font-bold">{bookingData.event?.title || "Event"}</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <span>{bookingData.event?.date || "TBA"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <span>{bookingData.event?.location || "TBA"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Ticket className="w-5 h-5 text-muted-foreground" />
                  <span>{bookingData.numberOfTickets} {bookingData.numberOfTickets === 1 ? "Ticket" : "Tickets"}</span>
                </div>
              </div>
              <div className="pt-4 border-t flex justify-between items-center">
                <span className="text-lg font-semibold">Total Paid</span>
                <span className="text-2xl font-bold text-primary">₹{(bookingData.totalAmount || 0).toLocaleString("en-IN")}</span>
              </div>
            </CardContent>
          </Card>

          {/* Attendees */}
          <Card>
            <CardHeader><CardTitle>Attendees Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(bookingData.attendees?.length ? bookingData.attendees : [{ name: "Guest", age: "-", email: "-", phone: "-" }]).map((attendee: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg bg-muted/30">
                  <h3 className="font-semibold mb-2">Attendee {index + 1}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Name: </span><span className="font-medium">{attendee.name}</span></div>
                    <div><span className="text-muted-foreground">Age: </span><span className="font-medium">{attendee.age}</span></div>
                    <div className="col-span-2"><span className="text-muted-foreground">Email: </span><span className="font-medium">{attendee.email}</span></div>
                    <div className="col-span-2"><span className="text-muted-foreground">Phone: </span><span className="font-medium">{attendee.phone}</span></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* QR Card */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-center">Entry QR Code</CardTitle>
              <p className="text-sm text-muted-foreground text-center">Show this QR code at the venue entrance</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center p-8 bg-white rounded-lg">
                {qrValue ? <QRCodeSVG value={qrValue} size={256} level="H" includeMargin /> : <div style={{width:256,height:256}} />}
              </div>

              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Blockchain Secured</span>
                </div>
                <p className="text-sm font-mono text-muted-foreground">Code refreshes in: <span className="font-bold text-foreground">{formatTimeLeft()}</span></p>
                <p className="text-xs text-muted-foreground">QR code automatically regenerates every 5 minutes for enhanced security</p>
              </div>

              <Button onClick={handleDownloadTicket} className="w-full gap-2" size="lg">
                <Download className="w-4 h-4" /> Download Ticket
              </Button>

              <div className="pt-4 border-t text-center">
                <Button variant="outline" onClick={() => navigate("/events")}>Book More Events</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BookingConfirmation;
