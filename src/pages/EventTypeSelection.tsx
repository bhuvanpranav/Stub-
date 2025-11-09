import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Music, Mic, Trophy, PartyPopper } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const EventTypeSelection = () => {
  const navigate = useNavigate();
  const { city } = useParams<{ city: string }>();
  
  const eventTypes = [
    {
      name: "Party",
      icon: PartyPopper,
      color: "from-pink-500 to-purple-500",
      description: "Club nights, DJ events, and celebrations"
    },
    {
      name: "Concert",
      icon: Music,
      color: "from-blue-500 to-cyan-500",
      description: "Live music performances and festivals"
    },
    {
      name: "Sports",
      icon: Trophy,
      color: "from-green-500 to-emerald-500",
      description: "Sports matches and tournaments"
    },
    {
      name: "Stand-up",
      icon: Mic,
      color: "from-orange-500 to-red-500",
      description: "Comedy shows and open mics"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px] animate-pulse delay-700" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-accent/15 rounded-full blur-[100px] animate-pulse delay-1000" />
        </div>
        
        <div className="container px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-6 px-6 py-2 bg-primary/10 rounded-full border border-primary/20">
              <p className="text-sm font-semibold text-primary capitalize">📍 {city}</p>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent capitalize leading-tight">
              Choose Your Experience
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-4">
              What type of event are you looking for?
            </p>
            <p className="text-sm text-muted-foreground">
              Select a category to explore amazing events happening in {city}
            </p>
          </div>
        </div>
      </section>

      {/* Event Type Selection */}
      <section className="container px-4 py-20 -mt-8">
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {eventTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card 
                key={type.name}
                className="group relative overflow-hidden cursor-pointer border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                onClick={() => navigate(`/events/${city}/${type.name.toLowerCase()}`)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${type.color} opacity-0 group-hover:opacity-[0.15] transition-all duration-500`} />
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${type.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-all duration-500`} />
                
                <div className="relative z-10 p-8 space-y-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold group-hover:text-primary transition-colors">{type.name}</h3>
                  </div>
                  <p className="text-muted-foreground text-base leading-relaxed pl-[72px]">
                    {type.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 pl-[72px]">
                    <span>Explore events</span>
                    <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default EventTypeSelection;
