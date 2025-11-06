import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, Users, Ticket, Music, Sparkles, CreditCard } from "lucide-react";
import { toast } from "sonner";

const Events = () => {
  const handlePayment = (tier: string, price: number) => {
    toast.info(`Payment integration for ${tier} ticket ($${price}) - Stripe integration coming soon!`);
    // TODO: Integrate Stripe payment here
  };

  const ticketTiers = [
    {
      name: "Early Bird",
      price: 10,
      features: ["General Admission", "Welcome Drink", "Event Swag Bag"],
    },
    {
      name: "VIP",
      price: 20,
      features: ["Priority Entry", "Open Bar", "VIP Lounge Access", "Meet & Greet"],
    },
    {
      name: "Platinum",
      price: 30,
      features: ["All VIP Benefits", "Premium Seating", "Exclusive After Party", "Backstage Access"],
    },
  ];

  const upcomingEvents = [
    {
      id: 2,
      title: "Tech Conference 2025",
      date: "November 20, 2025",
      location: "Convention Center, Bengaluru",
      attendees: 3000,
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
    },
    {
      id: 3,
      title: "Jazz Night",
      date: "December 5, 2025",
      location: "Blue Note Jazz Club, Bengaluru",
      attendees: 500,
      image: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Featured Party Event Hero */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/30 rounded-full blur-[128px] animate-pulse delay-700" />
        </div>
        
        <div className="container px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-medium">Featured Event - Limited Tickets</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Ultimate Summer Party 2025
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8">
              Join us for the most spectacular party event of the year with top DJs, live performances, and unforgettable experiences
            </p>

            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span>December, 2025</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span>Grand Plaza, Bengaluru</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span>2000+ Expected</span>
              </div>
            </div>

            <Button size="lg" className="gap-2" onClick={() => document.getElementById('tickets')?.scrollIntoView({ behavior: 'smooth' })}>
              <Music className="w-5 h-5" />
              Get Your Tickets Now
            </Button>
          </div>
        </div>
      </section>

      {/* Ticket Tiers Section */}
      <section id="tickets" className="py-16 container px-4 bg-muted/50">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Choose Your Experience</h2>
          <p className="text-xl text-muted-foreground">Select the perfect ticket tier for your party experience</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {ticketTiers.map((tier, index) => (
            <Card key={tier.name} className={`relative ${index === 1 ? 'border-primary shadow-xl scale-105' : ''}`}>
              {index === 1 && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription className="text-4xl font-bold text-foreground mt-4">
                  ${tier.price}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full gap-2" 
                  variant={index === 1 ? "default" : "outline"}
                  onClick={() => handlePayment(tier.name, tier.price)}
                >
                  <CreditCard className="w-4 h-4" />
                  Purchase Ticket
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Purchase Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Quick Purchase</CardTitle>
            <CardDescription>Enter your details to secure your spot</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success("Registration complete! Payment integration coming soon."); }}>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" required />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" required />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" required />
              </div>
              <Button type="submit" className="w-full gap-2">
                <CreditCard className="w-4 h-4" />
                Proceed to Payment
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Other Upcoming Events */}
      <section className="container px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">More Upcoming Events</h2>
          <p className="text-xl text-muted-foreground">Discover other amazing events</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {upcomingEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-xl transition-shadow">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={event.image} 
                  alt={event.title}
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
                <CardDescription className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {event.date}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {event.attendees.toLocaleString()} attendees
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="default">
                  <Ticket className="w-4 h-4 mr-2" />
                  Get Tickets
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Events;
