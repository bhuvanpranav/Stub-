import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Events = () => {
  const navigate = useNavigate();
  
  const cities = [
    {
      name: "Bengaluru",
      image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2",
      events: "50+ Events"
    },
    {
      name: "Chennai",
      image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220",
      events: "40+ Events"
    },
    {
      name: "Delhi",
      image: "https://images.unsplash.com/photo-1587474260584-136574528ed5",
      events: "60+ Events"
    },
    {
      name: "Hyderabad",
      image: "https://images.unsplash.com/photo-1609920658906-8223bd289001",
      events: "35+ Events"
    },
    {
      name: "Mumbai",
      image: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66",
      events: "70+ Events"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/30 rounded-full blur-[128px] animate-pulse delay-700" />
        </div>
        
        <div className="container px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Discover Events Near You
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8">
              Select your city to explore amazing events happening around you
            </p>
          </div>
        </div>
      </section>

      {/* City Selection */}
      <section className="container px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Choose Your City</h2>
          <p className="text-xl text-muted-foreground">Find the best events in your location</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {cities.map((city) => (
            <Card 
              key={city.name} 
              className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => navigate(`/events/${city.name.toLowerCase()}`)}
            >
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={city.image} 
                  alt={city.name}
                  className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">{city.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {city.events}
                      </p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Events;
