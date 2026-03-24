import { useState } from "react";
import { MapPin, Phone, Mail, Globe, Building2, Star, CheckCircle2, ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MOCK_AGENT = {
  slug: "prestige-properties",
  name: "Prestige Properties Ltd",
  tagline: "Your trusted partner in Nairobi real estate",
  description: "Prestige Properties Ltd is a licensed real estate agency operating in Nairobi since 2015. We specialize in residential and commercial property lettings across prime Nairobi neighborhoods including Kilimani, Lavington, Westlands, and Karen. Our team of experienced agents is dedicated to matching tenants with their perfect home.",
  email: "info@prestigeproperties.co.ke",
  phone: "+254 712 345 678",
  website: "www.prestigeproperties.co.ke",
  address: "Westlands Business Park, Nairobi",
  area: "Westlands, Nairobi",
  earbNumber: "EARB/2021/0042",
  verified: true,
  memberSince: "2021-03-15",
  agents: 7,
  listings: 24,
  successfulLets: 180,
  rating: 4.7,
  reviewCount: 48,
};

const LISTINGS = [
  { id: "1", title: "Modern 2BR in Kilimani", price: 55000, beds: 2, baths: 2, area: "Kilimani", img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=260&fit=crop" },
  { id: "2", title: "Elegant 1BR in Lavington", price: 40000, beds: 1, baths: 1, area: "Lavington", img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=260&fit=crop" },
  { id: "3", title: "Spacious 3BR in Karen", price: 120000, beds: 3, baths: 3, area: "Karen", img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=260&fit=crop" },
  { id: "4", title: "Cozy Studio in Westlands", price: 25000, beds: 0, baths: 1, area: "Westlands", img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=260&fit=crop" },
];

const REVIEWS = [
  { name: "David K.", rating: 5, date: "June 2024", text: "Excellent service! Found my apartment in Lavington within a week. Very professional team." },
  { name: "Sarah M.", rating: 4, date: "May 2024", text: "Good experience overall. Responsive and helpful throughout the process." },
  { name: "Peter O.", rating: 5, date: "April 2024", text: "Highly recommend Prestige Properties. They made the whole process smooth and stress-free." },
];

export default function AgentProfile() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [contactOpen, setContactOpen] = useState(false);
  const a = MOCK_AGENT;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">Agent Profile</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Profile Hero */}
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-heading font-bold text-2xl shrink-0">
            {a.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-heading font-bold">{a.name}</h1>
              {a.verified && (
                <Badge className="bg-green-100 text-green-700 border-0 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />Verified Agent
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-1">{a.tagline}</p>
            <div className="flex items-center gap-4 mt-3 flex-wrap text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{a.area}</span>
              <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />{a.rating} ({a.reviewCount} reviews)</span>
              <span>Member since {new Date(a.memberSince).toLocaleDateString("en-KE", { month: "long", year: "numeric" })}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button className="bg-secondary hover:bg-secondary/90" onClick={() => setContactOpen(!contactOpen)}>
              Contact Agent
            </Button>
          </div>
        </div>

        {/* Contact Panel */}
        {contactOpen && (
          <Card className="border-secondary/30 bg-secondary/5">
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <a href={`tel:${a.phone}`} className="flex items-center gap-2 text-sm hover:text-secondary transition-colors">
                <Phone className="h-4 w-4 text-muted-foreground" />{a.phone}
              </a>
              <a href={`mailto:${a.email}`} className="flex items-center gap-2 text-sm hover:text-secondary transition-colors">
                <Mail className="h-4 w-4 text-muted-foreground" />{a.email}
              </a>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="h-4 w-4" />{a.website}
              </span>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Active Listings", value: a.listings },
            { label: "Successful Lets", value: a.successfulLets },
            { label: "Team Agents", value: a.agents },
            { label: "EARB No.", value: a.earbNumber, small: true },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <p className={cn("font-heading font-bold", s.small ? "text-sm" : "text-2xl")}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* About */}
        <div className="space-y-2">
          <h2 className="text-lg font-heading font-semibold">About</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{a.description}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" />{a.address}
          </p>
        </div>

        {/* Active Listings */}
        <div className="space-y-4">
          <h2 className="text-lg font-heading font-semibold">Active Listings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {LISTINGS.map((l) => (
              <button key={l.id} onClick={() => navigate(`/marketplace/${l.id}`)} className="text-left rounded-xl border overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={l.img} alt={l.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium leading-tight">{l.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" />{l.area}</p>
                  <p className="text-sm font-semibold mt-2">KES {l.price.toLocaleString()}<span className="text-xs text-muted-foreground font-normal">/mo</span></p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {l.beds > 0 ? `${l.beds} bed · ` : "Studio · "}{l.baths} bath
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-heading font-semibold">Reviews</h2>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-semibold">{a.rating}</span>
              <span className="text-xs text-muted-foreground">({a.reviewCount})</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {REVIEWS.map((r, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{r.name}</p>
                    <span className="text-xs text-muted-foreground">{r.date}</span>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className={cn("h-3.5 w-3.5", j < r.rating ? "text-amber-500 fill-amber-500" : "text-muted stroke-muted-foreground")} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{r.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
