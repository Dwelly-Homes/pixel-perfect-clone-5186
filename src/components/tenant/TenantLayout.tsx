import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, Search, Heart, Bell, Calendar, CreditCard, MessageSquare, User, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Dashboard", href: "/tenant", icon: Home, exact: true },
  { label: "Browse", href: "/", icon: Search },
  { label: "Saved", href: "/tenant/saved", icon: Heart },
  { label: "Bookings", href: "/tenant/bookings", icon: Calendar },
  { label: "Payments", href: "/tenant/payments", icon: CreditCard },
  { label: "Messages", href: "/tenant/messages", icon: MessageSquare },
];

export default function TenantLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string, exact = false) =>
    exact ? location.pathname === href : location.pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Home className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground hidden sm:block">Dwelly Homes</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
                  isActive(link.href, link.exact)
                    ? "bg-secondary/10 text-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <link.icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Link to="/tenant/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center font-bold">3</span>
              </Button>
            </Link>
            <Link to="/tenant/profile">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-body font-bold text-sm cursor-pointer hover:ring-2 hover:ring-secondary/50 transition-all">
                JM
              </div>
            </Link>
            {/* Mobile menu toggle */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-card px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(link.href, link.exact)
                    ? "bg-secondary/10 text-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
            <Link
              to="/tenant/profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <User className="h-4 w-4" />Profile & Settings
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="h-4 w-4" />Sign Out
            </Link>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
