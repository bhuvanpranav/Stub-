import { Button } from "../components/ui/button";
import { ArrowRight, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-full blur-[128px]" />
      </div>

      <div className="container px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* CTA Card */}
          <div className="relative p-12 rounded-3xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border border-primary/20 overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />

            {/* Content */}
            <div className="relative z-10 text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-bold">
                  Ready to Transform Your{" "}
                  <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    Ticketing Experience?
                  </span>
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Join the future of concert ticketing. Secure, collectible, and built for fans.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <Button variant="hero" size="lg" className="group" onClick={() => navigate("/auth")}>
                  Start Building with STUB+
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="heroOutline" size="lg">
                  <Mail className="w-5 h-5" />
                  Contact Us
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-8 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span>Blockchain Secured</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary animate-pulse delay-75" />
                  <span>Zero Fraud Guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse delay-150" />
                  <span>Forever Collectibles</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
