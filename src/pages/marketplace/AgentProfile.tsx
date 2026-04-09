import { useState } from "react";
import { MapPin, Phone, Mail, Globe, Star, CheckCircle2, ArrowLeft, Loader2, AlertCircle, X } from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { api, getApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=260&fit=crop";

function StarRating({ value, onChange, size = "md" }: { value: number; onChange?: (v: number) => void; size?: "sm" | "md" }) {
  const [hover, setHover] = useState(0);
  const sz = size === "sm" ? "h-3.5 w-3.5" : "h-6 w-6";
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = (hover || value) > i;
        return (
          <Star
            key={i}
            className={cn(sz, "transition-colors", filled ? "text-amber-500 fill-amber-500" : "text-muted stroke-muted-foreground", onChange && "cursor-pointer")}
            onMouseEnter={() => onChange && setHover(i + 1)}
            onMouseLeave={() => onChange && setHover(0)}
            onClick={() => onChange?.(i + 1)}
          />
        );
      })}
    </div>
  );
}

function RatingModal({ tenantId, tenantName, onClose }: { tenantId: string; tenantName: string; onClose: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const mutation = useMutation({
    mutationFn: () => api.post("/reviews", { tenantId, rating, comment }),
    onSuccess: () => {
      toast.success("Review submitted!");
      queryClient.invalidateQueries({ queryKey: ["agentReviews", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["agentProfile"] });
      onClose();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 space-y-4 text-center">
            <Star className="h-10 w-10 text-amber-500 fill-amber-500 mx-auto" />
            <h3 className="text-lg font-heading font-semibold">Sign in to leave a review</h3>
            <p className="text-sm text-muted-foreground">You need an account to rate agents.</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1" asChild><Link to="/login">Sign In</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-heading font-semibold">Rate {tenantName}</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Your rating</p>
            <StarRating value={rating} onChange={setRating} />
            {rating > 0 && (
              <p className="text-xs text-muted-foreground">
                {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Your review <span className="text-muted-foreground font-normal">(optional)</span></p>
            <Textarea
              placeholder="Share your experience with this agent..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-secondary hover:bg-secondary/90"
              disabled={rating === 0 || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Review"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AgentProfile() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [contactOpen, setContactOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);

  const { data: agentData, isLoading: agentLoading, isError: agentError } = useQuery({
    queryKey: ["agentProfile", slug],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/tenants/slug/${slug}`, { _silent: true });
        return data?.data ?? data;
      } catch {
        // Fallback: search by slug query param
        const { data } = await api.get(`/tenants?slug=${slug}&accountType=estate_agent&limit=1`, { _silent: true });
        const items: any[] = data?.data ?? [];
        if (!items[0]) throw new Error("Agent not found");
        return items[0];
      }
    },
    enabled: !!slug,
    retry: 1,
  });

  const tenantId = agentData?._id;

  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ["agentListings", tenantId],
    queryFn: async () => {
      const { data } = await api.get(`/properties/marketplace?tenantId=${tenantId}&limit=8&status=available`, { _silent: true });
      return data;
    },
    enabled: !!tenantId,
  });

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ["agentReviews", tenantId],
    queryFn: async () => {
      const { data } = await api.get(`/reviews?tenantId=${tenantId}&limit=12`, { _silent: true });
      return data;
    },
    enabled: !!tenantId,
  });

  if (agentLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (agentError || !agentData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center px-4">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-lg font-heading font-semibold">Agent not found</h2>
        <p className="text-sm text-muted-foreground">This agent profile does not exist or has been removed.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const a = agentData;
  const isVerified = a.verificationStatus === "approved";
  const earbValid = !!(a.earbNumber && a.earbExpiryDate && new Date(a.earbExpiryDate) > new Date());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listings: any[] = listingsData?.data ?? [];
  const totalListings: number = listingsData?.meta?.total ?? listings.length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reviews: any[] = reviewsData?.data ?? [];
  const totalReviews: number = reviewsData?.meta?.total ?? reviews.length;
  const avgRating: number = reviewsData?.meta?.avgRating
    ?? (reviews.length > 0 ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length : 0);
  const teamCount: number = a.userCount ?? a.teamSize ?? 0;

  const initials = a.businessName ? a.businessName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() : "?";

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
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
          {a.logo ? (
            <img src={a.logo} alt={a.businessName} className="h-20 w-20 rounded-2xl object-cover shrink-0 border" />
          ) : (
            <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-heading font-bold text-2xl shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-heading font-bold">{a.businessName}</h1>
              {isVerified && (
                <Badge className="bg-green-100 text-green-700 border-0 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Verified Agent
                </Badge>
              )}
              {earbValid && (
                <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">EARB Licensed</Badge>
              )}
            </div>
            {a.tagline && <p className="text-muted-foreground text-sm mt-1">{a.tagline}</p>}
            <div className="flex items-center gap-4 mt-3 flex-wrap text-sm text-muted-foreground">
              {a.county && (
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{a.county}</span>
              )}
              {totalReviews > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  {avgRating.toFixed(1)} ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
                </span>
              )}
              {a.createdAt && (
                <span>Member since {new Date(a.createdAt).toLocaleDateString("en-KE", { month: "long", year: "numeric" })}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <Button variant="outline" onClick={() => setRatingOpen(true)}>
              <Star className="h-4 w-4 mr-1" /> Rate Agent
            </Button>
            <Button className="bg-secondary hover:bg-secondary/90" onClick={() => setContactOpen(!contactOpen)}>
              Contact Agent
            </Button>
          </div>
        </div>

        {/* Contact Panel */}
        {contactOpen && (
          <Card className="border-secondary/30 bg-secondary/5">
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {a.contactPhone && (
                <a href={`tel:${a.contactPhone}`} className="flex items-center gap-2 text-sm hover:text-secondary transition-colors">
                  <Phone className="h-4 w-4 text-muted-foreground" />{a.contactPhone}
                </a>
              )}
              {a.contactEmail && (
                <a href={`mailto:${a.contactEmail}`} className="flex items-center gap-2 text-sm hover:text-secondary transition-colors">
                  <Mail className="h-4 w-4 text-muted-foreground" />{a.contactEmail}
                </a>
              )}
              {a.website && (
                <a href={a.website.startsWith("http") ? a.website : `https://${a.website}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:text-secondary transition-colors">
                  <Globe className="h-4 w-4 text-muted-foreground" />{a.website}
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Active Listings", value: totalListings },
            { label: "Successful Lets", value: a.successfulLets ?? "—" },
            { label: "Team Agents", value: teamCount || "—" },
            { label: "EARB No.", value: a.earbNumber || "—", small: true },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <p className={cn("font-heading font-bold", s.small ? "text-sm break-all" : "text-2xl")}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* About */}
        {(a.description || a.address) && (
          <div className="space-y-2">
            <h2 className="text-lg font-heading font-semibold">About</h2>
            {a.description && <p className="text-sm text-muted-foreground leading-relaxed">{a.description}</p>}
            {a.address && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-2">
                <MapPin className="h-3.5 w-3.5 shrink-0" />{a.address}
              </p>
            )}
          </div>
        )}

        {/* Active Listings */}
        <div className="space-y-4">
          <h2 className="text-lg font-heading font-semibold">
            Active Listings {!listingsLoading && <span className="text-muted-foreground font-normal text-sm">({totalListings})</span>}
          </h2>
          {listingsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border overflow-hidden">
                  <div className="aspect-[4/3] bg-muted animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No active listings at the moment.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {listings.map((l: any) => {
                const rawImages: { url: string; isCover?: boolean }[] = l.images || [];
                const cover = rawImages.find((i) => i.isCover)?.url || rawImages[0]?.url || PLACEHOLDER_IMAGE;
                const price = l.monthlyRent ?? l.price ?? 0;
                const area = l.neighborhood || l.county || "";
                return (
                  <Link key={l._id} to={`/marketplace/${l._id}`} className="text-left rounded-xl border overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={cover} alt={l.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium leading-tight line-clamp-1">{l.title}</p>
                      {area && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" />{area}</p>}
                      <p className="text-sm font-semibold mt-2">KES {price.toLocaleString()}<span className="text-xs text-muted-foreground font-normal">/mo</span></p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-heading font-semibold">Reviews</h2>
              {totalReviews > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-semibold">{avgRating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({totalReviews})</span>
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => setRatingOpen(true)}>
              <Star className="h-3.5 w-3.5 mr-1" /> Write a Review
            </Button>
          </div>

          {reviewsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}><CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
                  <div className="h-12 bg-muted rounded animate-pulse" />
                </CardContent></Card>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center space-y-3">
                <Star className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review this agent.</p>
                <Button variant="outline" size="sm" onClick={() => setRatingOpen(true)}>Write a Review</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reviews.map((r: any, i: number) => (
                <Card key={r._id ?? i}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                          {(r.reviewerName || r.userId?.fullName || "U")[0].toUpperCase()}
                        </div>
                        <p className="text-sm font-medium">{r.reviewerName || r.userId?.fullName || "Anonymous"}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString("en-KE", { month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <StarRating value={r.rating} size="sm" />
                    {r.comment && <p className="text-xs text-muted-foreground leading-relaxed">{r.comment}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {ratingOpen && (
        <RatingModal
          tenantId={tenantId}
          tenantName={a.businessName}
          onClose={() => setRatingOpen(false)}
        />
      )}
    </div>
  );
}
