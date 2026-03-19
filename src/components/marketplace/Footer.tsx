import { Home, Phone, Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center">
                <Home className="h-4 w-4 text-secondary-foreground" />
              </div>
              <span className="font-heading font-bold text-lg">Dwelly Homes</span>
            </div>
            <p className="text-primary-foreground/70 text-sm font-body leading-relaxed">
              Kenya's trusted property marketplace connecting verified agents and landlords with quality tenants.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm font-body text-primary-foreground/70">
              <li><Link to="/" className="hover:text-secondary transition-colors">Browse Properties</Link></li>
              <li><Link to="/register" className="hover:text-secondary transition-colors">List Your Property</Link></li>
              <li><Link to="/login" className="hover:text-secondary transition-colors">Agent Login</Link></li>
            </ul>
          </div>

          {/* Property Types */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Property Types</h4>
            <ul className="space-y-2 text-sm font-body text-primary-foreground/70">
              <li>Bedsitters & Studios</li>
              <li>1-2 Bedroom Apartments</li>
              <li>3+ Bedroom Apartments</li>
              <li>Maisonettes & Townhouses</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm font-body text-primary-foreground/70">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-secondary" />
                +254 700 000 000
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-secondary" />
                hello@dwellyhomes.co.ke
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-secondary" />
                Nairobi, Kenya
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-10 pt-6 text-center text-xs font-body text-primary-foreground/50">
          © {new Date().getFullYear()} Dwelly Homes. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
