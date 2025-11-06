import { Search, ShoppingCart, RefreshCw, CheckCircle, Ticket, Archive } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: Search,
      number: "01",
      title: "Browse Concert",
      description: "See NFT-enabled events flagged for extra security and collectibility",
      value: "Trust + Clarity"
    },
    {
      icon: ShoppingCart,
      number: "02",
      title: "Purchase Ticket",
      description: "Buy with secure token generated automatically",
      value: "Verified Ownership"
    },
    {
      icon: RefreshCw,
      number: "03",
      title: "Safe Resale",
      description: "List ticket in official resale marketplace if plans change",
      value: "Safe + Regulated"
    },
    {
      icon: CheckCircle,
      number: "04",
      title: "Secure Transfer",
      description: "Buyer purchases with secure ownership transfer",
      value: "No Fraud"
    },
    {
      icon: Ticket,
      number: "05",
      title: "Attend Event",
      description: "Ticket validated at entry with same convenience",
      value: "Seamless Experience"
    },
    {
      icon: Archive,
      number: "06",
      title: "Memory Vault",
      description: "NFT moves to your collection as a lasting memento",
      value: "Emotional Value"
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-b from-background to-muted/20">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">
              How{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                It Works
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A seamless journey from browsing to collecting, with security at every step
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="relative group"
              >
                {/* Connecting Line (hidden on mobile, shown on desktop for flow) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent -translate-x-8 z-0" />
                )}

                {/* Card */}
                <div className="relative z-10 p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 h-full">
                  {/* Step Number */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-sm shadow-lg">
                    {step.number}
                  </div>

                  <div className="space-y-4">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <step.icon className="w-7 h-7 text-primary" />
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    {/* Value Badge */}
                    <div className="pt-3">
                      <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {step.value}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
