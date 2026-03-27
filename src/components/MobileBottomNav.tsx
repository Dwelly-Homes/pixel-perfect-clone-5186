import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { MoreHorizontal, X } from "lucide-react";
import { useState } from "react";

export interface MobileNavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  onClick?: () => void;
  badge?: number;
  exact?: boolean;
}

interface MobileBottomNavProps {
  primaryItems: MobileNavItem[];
  moreItems?: MobileNavItem[];
  onMoreClick?: () => void;
}

export function MobileBottomNav({ primaryItems, moreItems, onMoreClick }: MobileBottomNavProps) {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  const isActive = (href: string, exact = false) =>
    exact ? location.pathname === href : location.pathname.startsWith(href);

  const hasMore = (moreItems && moreItems.length > 0) || !!onMoreClick;

  const handleMoreClick = () => {
    if (onMoreClick) {
      onMoreClick();
    } else {
      setShowMore(true);
    }
  };

  const BarItem = ({ item }: { item: MobileNavItem }) => {
    const active = item.href ? isActive(item.href, item.exact) : false;
    const content = (
      <>
        <div className="relative">
          <item.icon className="h-5 w-5" />
          {item.badge != null && item.badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 rounded-full bg-destructive text-[9px] text-white flex items-center justify-center font-bold px-0.5 leading-none">
              {item.badge > 9 ? "9+" : item.badge}
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium leading-none">{item.label}</span>
      </>
    );

    const cls = cn(
      "flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors",
      active ? "text-primary" : "text-muted-foreground"
    );

    return item.href ? (
      <Link to={item.href} className={cls}>
        {content}
      </Link>
    ) : (
      <button onClick={item.onClick} className={cls}>
        {content}
      </button>
    );
  };

  const SheetItem = ({ item }: { item: MobileNavItem }) => {
    const active = item.href ? isActive(item.href, item.exact) : false;
    const inner = (
      <div
        className={cn(
          "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors",
          active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
        )}
      >
        <item.icon className="h-5 w-5" />
        <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
      </div>
    );

    return item.href ? (
      <Link to={item.href} onClick={() => setShowMore(false)}>
        {inner}
      </Link>
    ) : (
      <button
        className="w-full"
        onClick={() => {
          item.onClick?.();
          setShowMore(false);
        }}
      >
        {inner}
      </button>
    );
  };

  return (
    <>
      {/* Bottom navigation bar — mobile only */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-stretch h-14">
          {primaryItems.map((item) => (
            <BarItem key={item.label} item={item} />
          ))}
          {hasMore && (
            <button
              onClick={handleMoreClick}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-muted-foreground transition-colors"
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-none">More</span>
            </button>
          )}
        </div>
      </nav>

      {/* More bottom sheet */}
      {showMore && moreItems && moreItems.length > 0 && (
        <>
          <div
            className="md:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={() => setShowMore(false)}
          />
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-[70] bg-card rounded-t-2xl border-t border-border shadow-2xl">
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-border">
              <h3 className="text-sm font-semibold">More</h3>
              <button
                onClick={() => setShowMore(false)}
                className="h-6 w-6 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1 p-4">
              {moreItems.map((item) => (
                <SheetItem key={item.label} item={item} />
              ))}
            </div>
            <div style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }} />
          </div>
        </>
      )}
    </>
  );
}
