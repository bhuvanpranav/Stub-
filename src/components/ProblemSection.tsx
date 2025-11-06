import { AlertTriangle, FileX } from "lucide-react";
import { Card } from "../components/ui/card";

const ProblemSection = () => {
  const problems = [
    {
      icon: AlertTriangle,
      title: "Resale Insecurity",
      description: "Fake tickets, scammers, and unpredictable pricing dominate resale marketplaces. Users want to resell tickets safely and buy with confidence.",
      stats: "$5.11B",
      statsLabel: "Secondary ticket market by 2030"
    },
    {
      icon: FileX,
      title: "Lost Memories",
      description: "After the event ends, digital tickets vanish into the void. Fans want souvenirs that retain emotional value long after the concert.",
      stats: "0",
      statsLabel: "Digital memorabilia currently"
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">
              Concert Fans Face Two Big{" "}
              <span className="bg-gradient-to-r from-destructive to-destructive/70 bg-clip-text text-transparent">
                Frustrations
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The current ticketing system leaves fans vulnerable and memories forgotten
            </p>
          </div>

          {/* Problem Cards */}
          <div className="grid md:grid-cols-2 gap-8">
            {problems.map((problem, index) => (
              <Card 
                key={index}
                className="p-8 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 group"
              >
                <div className="space-y-6">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-destructive/20 to-destructive/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <problem.icon className="w-8 h-8 text-destructive" />
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold">{problem.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {problem.description}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="pt-4 border-t border-border/50">
                    <div className="text-3xl font-bold text-primary">{problem.stats}</div>
                    <div className="text-sm text-muted-foreground">{problem.statsLabel}</div>
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

export default ProblemSection;
