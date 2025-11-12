import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Search, Ticket } from "lucide-react";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

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

  // Mock events data - in real app, this would come from a database
  const allEvents = [
    {
      id: 1,
      title: "Summer Music Festival",
      date: "August 15, 2025",
      location: "Grand Plaza",
      type: "concert",
      city: "bengaluru",
      image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea",
      price: "₹3,999"
    },
    {
      id: 2,
      title: "Saturday Night Party",
      date: "August 20, 2025",
      location: "Club Matrix",
      type: "party",
      city: "bengaluru",
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
      price: "₹2,499"
    },
    {
      id: 3,
      title: "Cricket Premier League",
      date: "September 5, 2025",
      location: "Stadium Arena",
      type: "sports",
      city: "bengaluru",
      image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da",
      price: "₹2,899"
    },
    {
      id: 4,
      title: "Comedy Night Live",
      date: "August 25, 2025",
      location: "Laugh Factory",
      type: "stand-up",
      city: "bengaluru",
      image: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca",
      price: "₹1,999"
    },
    {
      id: 5,
      title: "Rock Concert Experience",
      date: "September 10, 2025",
      location: "Arena Hall",
      type: "concert",
      city: "mumbai",
      image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3",
      price: "₹4,499"
    },
    {
      id: 6,
      title: "Techno Night",
      date: "August 30, 2025",
      location: "Underground Club",
      type: "party",
      city: "mumbai",
      image: "https://images.unsplash.com/photo-1571266028243-d220e2ffaa53",
      price: "₹2,899"
    }
  ];

  const filteredEvents = allEvents.filter(event => 
    event.city === city?.toLowerCase() && 
    event.type === type?.toLowerCase() &&
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
    const newForms = Array(num).fill(null).map((_, index) => 
      bookingForms[index] || {
        name: "",
        age: "",
        email: "",
        phone: "",
        address: "",
        sex: ""
      }
    );
    setBookingForms(newForms);
  };

  const updateBookingForm = (index: number, field: string, value: string) => {
    const updatedForms = [...bookingForms];
    updatedForms[index] = { ...updatedForms[index], [field]: value };
    setBookingForms(updatedForms);
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Load Razorpay SDK
    const res = await loadRazorpay();
    if (!res) {
      toast.error('Failed to load payment gateway');
      return;
    }

    // Calculate total amount
    const priceValue = parseInt(selectedEvent.price.replace(/[^0-9]/g, ''));
    const totalAmount = priceValue * numberOfTickets;

    // Create Razorpay order options
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_demo',
      amount: totalAmount * 100, // Amount in paise
      currency: 'INR',
      name: 'Stub Events',
      description: `${numberOfTickets} ticket(s) for ${selectedEvent.title}`,
      image: 'https://example.com/logo.png',
      handler: function (response: any) {
        // Store booking data and navigate to confirmation
        const bookingData = {
          event: selectedEvent,
          attendees: bookingForms,
          numberOfTickets,
          totalAmount,
          paymentId: response.razorpay_payment_id,
          bookingId: `STUB${Date.now()}`,
          bookingDate: new Date().toISOString()
        };
        
        localStorage.setItem('latestBooking', JSON.stringify(bookingData));
        toast.success('Payment successful!');
        setBookingDialogOpen(false);
        window.location.href = `/booking-confirmation`;
      },
      prefill: {
        name: bookingForms[0].name,
        email: bookingForms[0].email,
        contact: bookingForms[0].phone
      },
      theme: {
        color: '#3399cc'
      }
    };

    const paymentObject = new (window as any).Razorpay(options);
    paymentObject.open();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header with Search */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20">
        <div className="container px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 capitalize">
              {type} Events in {city}
            </h1>
            <p className="text-xl text-muted-foreground">
              Discover amazing {type} events happening near you
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Search events..."
                className="pl-12 h-14 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="container px-4 py-16">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-muted-foreground">No events found matching your search.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-xl transition-shadow group">
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={event.image} 
                    alt={event.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold">
                    {event.price}
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">{event.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                </CardContent>
                <CardContent className="pt-0">
                  <Button 
                    className="w-full gap-2" 
                    onClick={() => handleBookNow(event)}
                  >
                    <Ticket className="w-4 h-4" />
                    Book Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book Your Tickets</DialogTitle>
            <DialogDescription>
              Complete your booking for {selectedEvent?.title}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBookingSubmit} className="space-y-6 mt-4">
            {/* Number of Tickets */}
            <div className="space-y-2">
              <Label htmlFor="numberOfTickets">Number of Tickets *</Label>
              <Select
                value={numberOfTickets.toString()}
                onValueChange={(value) => handleTicketNumberChange(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select number of tickets" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? 'Ticket' : 'Tickets'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Attendee Forms */}
            {bookingForms.map((form, index) => (
              <div key={index} className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <h3 className="font-semibold text-lg">Attendee {index + 1}</h3>
                
                <div className="space-y-2">
                  <Label htmlFor={`name-${index}`}>Full Name *</Label>
                  <Input
                    id={`name-${index}`}
                    required
                    value={form.name}
                    onChange={(e) => updateBookingForm(index, 'name', e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`age-${index}`}>Age *</Label>
                  <Input
                    id={`age-${index}`}
                    type="number"
                    required
                    value={form.age}
                    onChange={(e) => updateBookingForm(index, 'age', e.target.value)}
                    placeholder="Enter age"
                    min="1"
                    max="120"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`email-${index}`}>Email *</Label>
                  <Input
                    id={`email-${index}`}
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => updateBookingForm(index, 'email', e.target.value)}
                    placeholder="your.email@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`phone-${index}`}>Phone Number *</Label>
                  <Input
                    id={`phone-${index}`}
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => updateBookingForm(index, 'phone', e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`address-${index}`}>Address *</Label>
                  <Input
                    id={`address-${index}`}
                    required
                    value={form.address}
                    onChange={(e) => updateBookingForm(index, 'address', e.target.value)}
                    placeholder="Enter address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`sex-${index}`}>Gender *</Label>
                  <Select
                    required
                    value={form.sex}
                    onValueChange={(value) => updateBookingForm(index, 'sex', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}

            {/* Payment Summary */}
            <div className="pt-4 space-y-3 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Price per ticket:</span>
                <span className="font-semibold">{selectedEvent?.price}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Number of tickets:</span>
                <span className="font-semibold">{numberOfTickets}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">Total Amount:</span>
                <span className="font-bold text-2xl text-primary">
                  ₹{(parseInt(selectedEvent?.price.replace(/[^0-9]/g, '') || '0') * numberOfTickets).toLocaleString('en-IN')}
                </span>
              </div>
              <Button type="submit" className="w-full" size="lg">
                Proceed to Payment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default EventListings;