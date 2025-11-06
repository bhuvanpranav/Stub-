import { TrendingUp, Users, DollarSign, AlertCircle } from "lucide-react";

const ImpactSection = () => {
  const metrics = [
    {
      icon: DollarSign,
      value: "+10-20%",
      label: "Secondary Market Revenue",
      description: "Per concert via commissions on secure resales"
    },
    {
      icon: Users,
      value: "+15%",
      label: "App Retention",
      description: "Collectors returning to complete their sets"
    },
    {
      icon: TrendingUp,
      value: "+8%",
      label: "Premium Ticket Sales",
      description: "New customers attracted by collectibles"
    },
    {
      icon: AlertCircle,
      value: "-60%",
      label: "Fraud Complaints",
      description: "After official resale marketplace launch"
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-b from-muted/20 to-background">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">
              Measurable{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Business Impact
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Designed for both topline growth and brand loyalty
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <div 
                key={index}
                className="relative group"
              >
                {/* Card */}
                <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 h-full">
                  <div className="space-y-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <metric.icon className="w-6 h-6 text-primary" />
                    </div>

                    {/* Value */}
                    <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {metric.value}
                    </div>

                    {/* Label */}
                    <div className="space-y-2">
                      <div className="font-semibold text-foreground">
                        {metric.label}
                      </div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {metric.description}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Glow Effect on Hover */}
                <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary/0 to-secondary/0 group-hover:from-primary/10 group-hover:to-secondary/10 blur-xl transition-all duration-300" />
              </div>
            ))}
          </div>

          {/* Bottom Statement */}
          <div className="mt-16 text-center">
            <div className="inline-block p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-primary/20">
              <p className="text-lg text-foreground max-w-3xl">
                <span className="font-bold text-primary">STUB+</span> transforms ticketing from a commodity into a{" "}
                <span className="font-semibold text-secondary">revenue-generating</span>,{" "}
                <span className="font-semibold text-accent">loyalty-building</span> ecosystem
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;
