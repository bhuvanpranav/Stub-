import { ShieldCheck, Store, Vault, Palette } from "lucide-react";
import { Card } from "../components/ui/card";

const FeaturesSection = () => {
  const features = [
    {
      icon: ShieldCheck,
      title: "Blockchain-Backed Identity",
      description: "Every ticket has a unique, tamper-proof digital signature that eliminates counterfeiting and provides 100% ownership transparency.",
      badge: "Must Have",
      gradient: "from-primary/20 to-primary/5"
    },
    {
      icon: Store,
      title: "Secure Resale Marketplace",
      description: "Built-in resale platform with verified sellers, transparent pricing, and automatic ownership transfer. No more third-party scams.",
      badge: "Must Have",
      gradient: "from-secondary/20 to-secondary/5"
    },
    {
      icon: Vault,
      title: "Memory Vault",
      description: "After the concert, your ticket transforms into a beautiful digital collectible you can keep forever and share on social media.",
      badge: "Core Feature",
      gradient: "from-accent/20 to-accent/5"
    },
    {
      icon: Palette,
      title: "Limited Edition Designs",
      description: "Artist-approved exclusive visuals for top concerts. Ultra-rare designs make your tickets even more valuable collectibles.",
      badge: "Premium",
      gradient: "from-primary-glow/20 to-primary/5"
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-accent/10 rounded-full blur-[128px]" />
      </div>

      <div className="container px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">
              Powerful{" "}
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Features
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need for secure, memorable concert experiences
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="group p-8 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_40px_hsl(var(--primary)/0.1)]"
              >
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <feature.icon className="w-7 h-7 text-primary" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {feature.badge}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
