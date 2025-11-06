import { Shield, Key, Heart } from "lucide-react";
import nftTicket from "@/assets/nft-ticket.jpg";

const SolutionSection = () => {
  const pillars = [
    {
      icon: Shield,
      title: "Security",
      description: "Buy authenticated blockchain tickets with tracking for issuers and security for buyers",
      color: "from-primary to-primary-glow"
    },
    {
      icon: Key,
      title: "Ownership",
      description: "Resell safely within the app with hassle-free last-moment cancellation and transparent pricing",
      color: "from-secondary to-primary"
    },
    {
      icon: Heart,
      title: "Memories",
      description: "Keep a lifelong memorable token with everything embedded in one digital collectible",
      color: "from-accent to-secondary"
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-[128px]" />
      </div>

      <div className="container px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">
              The{" "}
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                STUB+ Solution
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              NFT-powered Smart Tickets seamlessly integrated. Users don't need to understand blockchain—they simply enjoy the benefits.
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* NFT Ticket Visual */}
            <div className="relative order-2 lg:order-1">
              <div className="relative rounded-3xl overflow-hidden group">
                <img 
                  src={nftTicket} 
                  alt="NFT Concert Ticket" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-50" />
                
                {/* Floating Badge */}
                <div className="absolute top-6 right-6 px-4 py-2 rounded-full bg-primary/90 backdrop-blur-sm border border-primary-glow/50">
                  <span className="text-sm font-semibold">NFT Verified</span>
                </div>
              </div>
            </div>

            {/* Three Pillars */}
            <div className="space-y-6 order-1 lg:order-2">
              {pillars.map((pillar, index) => (
                <div 
                  key={index}
                  className="group p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)]"
                >
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${pillar.color} p-0.5 group-hover:scale-110 transition-transform`}>
                      <div className="w-full h-full rounded-xl bg-background flex items-center justify-center">
                        <pillar.icon className="w-6 h-6 text-primary" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-2 flex-1">
                      <h3 className="text-xl font-bold">{pillar.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
