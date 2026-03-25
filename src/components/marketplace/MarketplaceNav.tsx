import { Link } from "react-router-dom";
import { Home, ChevronDown, LayoutDashboard, LogOut, UserCircle2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth, type AuthUser } from "@/contexts/AuthContext";

function getDashboardLink(user: AuthUser): string {
  if (user.role === "platform_admin") return "/admin";
  if (user.role === "searcher") return "/tenant";
  return "/dashboard";
}

function getDashboardLabel(user: AuthUser): string {
  if (user.role === "platform_admin") return "Admin Panel";
  if (user.role === "searcher") return "My Dashboard";
  return "Dashboard";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function MarketplaceNav() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  return (
    <nav className="sticky top-0 z-30 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <Home className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-lg text-foreground">Dwelly Homes</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
          >
            Marketplace
          </Link>

          {user ? (
            <>
              {/* Dashboard quick link */}
              <Link
                to={getDashboardLink(user)}
                className="hidden sm:flex items-center gap-1.5 rounded-md bg-secondary px-3.5 py-2 text-sm font-body font-medium text-secondary-foreground hover:bg-orange-dark transition-colors"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                {getDashboardLabel(user)}
              </Link>

              {/* User avatar dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-full pl-1 pr-2.5 py-1 bg-muted hover:bg-muted/70 transition-colors"
                  aria-label="User menu"
                >
                  <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                    {getInitials(user.fullName)}
                  </div>
                  <span className="text-sm font-body text-foreground hidden sm:block max-w-[100px] truncate">
                    {user.fullName.split(" ")[0]}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown */}
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-xl overflow-hidden z-50 animate-fade-in">
                    {/* User info header */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
                      <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                        {getInitials(user.fullName)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="p-1.5">
                      <Link
                        to={getDashboardLink(user)}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-body text-foreground hover:bg-muted transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        {getDashboardLabel(user)}
                      </Link>
                      <Link
                        to={user.role === "searcher" ? "/tenant/profile" : "/dashboard/settings/organization"}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-body text-foreground hover:bg-muted transition-colors"
                      >
                        <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                        Profile & Settings
                      </Link>
                      <div className="my-1 border-t border-border" />
                      <button
                        onClick={() => { logout(); setMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-body text-destructive hover:bg-destructive/8 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
