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
  const [bookingForm, setBookingForm] = useState({
    name: "",
    age: "",
    email: "",
    phone: "",
    address: "",
    sex: ""
  });

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
    setBookingDialogOpen(true);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Booking confirmed for ${selectedEvent.title}!`);
    setBookingDialogOpen(false);
    setBookingForm({
      name: "",
      age: "",
      email: "",
      phone: "",
      address: "",
      sex: ""
    });
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
                  <CardDescription className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {event.date}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book Your Ticket</DialogTitle>
            <DialogDescription>
              Complete your booking for {selectedEvent?.title}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBookingSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                required
                value={bookingForm.name}
                onChange={(e) => setBookingForm({...bookingForm, name: e.target.value})}
                placeholder="Enter your full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                required
                value={bookingForm.age}
                onChange={(e) => setBookingForm({...bookingForm, age: e.target.value})}
                placeholder="Enter your age"
                min="1"
                max="120"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={bookingForm.email}
                onChange={(e) => setBookingForm({...bookingForm, email: e.target.value})}
                placeholder="your.email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                required
                value={bookingForm.phone}
                onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                required
                value={bookingForm.address}
                onChange={(e) => setBookingForm({...bookingForm, address: e.target.value})}
                placeholder="Enter your address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sex">Gender *</Label>
              <Select
                required
                value={bookingForm.sex}
                onValueChange={(value) => setBookingForm({...bookingForm, sex: value})}
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

            <div className="pt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ticket Price:</span>
                <span className="font-bold text-lg">{selectedEvent?.price}</span>
              </div>
              <Button type="submit" className="w-full" size="lg">
                Confirm Booking
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
