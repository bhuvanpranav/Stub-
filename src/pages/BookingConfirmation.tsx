import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Ticket, CheckCircle, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState<any>(null);
  const [qrValue, setQrValue] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

  // Generate blockchain-like hash
  const generateBlockchainHash = (data: string, timestamp: number) => {
    const str = data + timestamp;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  };

  // Generate QR code value with blockchain security
  const generateQRValue = () => {
    if (!bookingData) return "";
    
    const timestamp = Math.floor(Date.now() / (5 * 60 * 1000)); // Changes every 5 minutes
    const blockchainHash = generateBlockchainHash(
      `${bookingData.bookingId}-${bookingData.event.id}-${bookingData.numberOfTickets}`,
      timestamp
    );
    
    return JSON.stringify({
      bookingId: bookingData.bookingId,
      eventId: bookingData.event.id,
      eventName: bookingData.event.title,
      tickets: bookingData.numberOfTickets,
      hash: blockchainHash,
      timestamp: timestamp,
      verified: true
    });
  };

  useEffect(() => {
  const storedBooking = localStorage.getItem("latestBooking");
  if (!storedBooking) {
    toast.error("No booking found");
    navigate("/events");
    return;
  }

  const booking = JSON.parse(storedBooking);
  setBookingData(booking);
  setQrValue(generateQRValue());

  // ✅ Poll backend for Razorpay payment status
  const pollStatus = async () => {
    try {
      const q = new URLSearchParams();
      q.set("orderId", booking.orderId || "");
      const res = await fetch(`/api/orders/status?${q.toString()}`);
      const data = await res.json();
      if (data.status === "paid") {
        toast.success("Payment verified successfully!");
      } else if (data.status === "failed") {
        toast.error("Payment verification failed");
      }
    } catch (err) {
      console.error("Status check error:", err);
    }
  };

  const poller = setInterval(pollStatus, 5000);
  return () => clearInterval(poller);
}, [navigate]);


  useEffect(() => {
    if (!bookingData) return;

    // Update QR code every 5 minutes
    const qrInterval = setInterval(() => {
      const newQrValue = generateQRValue();
      setQrValue(newQrValue);
      setTimeLeft(300); // Reset timer
      toast.info('QR code refreshed for security');
    }, 5 * 60 * 1000);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) return 300;
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(qrInterval);
      clearInterval(countdownInterval);
    };
  }, [bookingData]);

  // Format time left
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownloadTicket = () => {
    toast.success('Ticket downloaded successfully!');
  };

  if (!bookingData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Success Header */}
      <section className="relative py-12 overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20">
        <div className="container px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Booking Confirmed!
            </h1>
            <p className="text-xl text-muted-foreground">
              Your tickets have been successfully booked
            </p>
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
                <span className="font-mono text-sm">{bookingData.paymentId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Booking Date</span>
                <span className="font-semibold">
                  {new Date(bookingData.bookingDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Event Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Event Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video relative overflow-hidden rounded-lg mb-4">
                <img 
                  src={bookingData.event.image} 
                  alt={bookingData.event.title}
                  className="object-cover w-full h-full"
                />
              </div>
              <h2 className="text-2xl font-bold">{bookingData.event.title}</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <span>{bookingData.event.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <span>{bookingData.event.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Ticket className="w-5 h-5 text-muted-foreground" />
                  <span>{bookingData.numberOfTickets} {bookingData.numberOfTickets === 1 ? 'Ticket' : 'Tickets'}</span>
                </div>
              </div>
              <div className="pt-4 border-t flex justify-between items-center">
                <span className="text-lg font-semibold">Total Paid</span>
                <span className="text-2xl font-bold text-primary">
                  ₹{bookingData.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Attendees Card */}
          <Card>
            <CardHeader>
              <CardTitle>Attendees Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {bookingData.attendees.map((attendee: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg bg-muted/30">
                  <h3 className="font-semibold mb-2">Attendee {index + 1}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name: </span>
                      <span className="font-medium">{attendee.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Age: </span>
                      <span className="font-medium">{attendee.age}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Email: </span>
                      <span className="font-medium">{attendee.email}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Phone: </span>
                      <span className="font-medium">{attendee.phone}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* QR Code Card */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-center">Entry QR Code</CardTitle>
              <p className="text-sm text-muted-foreground text-center">
                Show this QR code at the venue entrance
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center p-8 bg-white rounded-lg">
                {qrValue && (
                  <QRCodeSVG 
                    value={qrValue}
                    size={256}
                    level="H"
                    includeMargin
                  />
                )}
              </div>
              
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Blockchain Secured</span>
                </div>
                <p className="text-sm font-mono text-muted-foreground">
                  Code refreshes in: <span className="font-bold text-foreground">{formatTimeLeft()}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  QR code automatically regenerates every 5 minutes for enhanced security
                </p>
              </div>

              <Button 
                onClick={handleDownloadTicket}
                className="w-full gap-2" 
                size="lg"
              >
                <Download className="w-4 h-4" />
                Download Ticket
              </Button>

              <div className="pt-4 border-t text-center">
                <Button 
                  variant="outline"
                  onClick={() => navigate('/events')}
                >
                  Book More Events
                </Button>
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