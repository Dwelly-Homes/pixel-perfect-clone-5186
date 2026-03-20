import { Link } from "react-router-dom";
import { Home, Shield, Users, TrendingUp } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const features = [
  { icon: Shield, text: "Verified properties & agents" },
  { icon: Users, text: "Trusted by 10,000+ Kenyans" },
  { icon: TrendingUp, text: "Real-time market insights" },
];

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Navy brand panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] bg-primary flex-col justify-between p-10 text-primary-foreground relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-navy-light/30" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-navy-light/20" />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 mb-16">
            <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
              <Home className="h-5 w-5 text-secondary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl">Dwelly Homes</span>
          </Link>

          <h1 className="font-heading text-3xl xl:text-4xl font-bold leading-tight text-balance mb-4">
            {title || "Find your perfect home in Kenya"}
          </h1>
          <p className="text-primary-foreground/70 font-body text-base leading-relaxed max-w-sm">
            {subtitle || "Kenya's trusted property marketplace connecting tenants, landlords, and agents."}
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {features.map((f) => (
            <div key={f.text} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-md bg-navy-light flex items-center justify-center">
                <f.icon className="h-4 w-4 text-secondary" />
              </div>
              <span className="text-sm font-body text-primary-foreground/80">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-background">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
