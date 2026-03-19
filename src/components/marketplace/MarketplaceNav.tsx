import { Link } from "react-router-dom";
import { Home } from "lucide-react";

export function MarketplaceNav() {
  return (
    <nav className="sticky top-0 z-30 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <Home className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-lg text-foreground">Dwelly Homes</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
          >
            Marketplace
          </Link>
          <Link
            to="/login"
            className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="rounded-md bg-secondary px-4 py-2 text-sm font-body font-medium text-secondary-foreground hover:bg-orange-dark transition-colors"
          >
            List Property
          </Link>
        </div>
      </div>
    </nav>
  );
}
