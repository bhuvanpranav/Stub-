import stubLogo from "@/assets/stub-logo.jpg";

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border/50">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img 
                src={stubLogo} 
                alt="STUB+ Logo" 
                className="h-12 w-auto"
              />
            </div>

            {/* Copyright */}
            <div className="text-sm text-muted-foreground">
              © 2025 STUB+. Turning Tickets into Digital Treasures.
            </div>

            {/* Created by */}
            <div className="text-sm text-muted-foreground">
              Created by Bhuvan K
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
