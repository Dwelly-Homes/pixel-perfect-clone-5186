import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Facebook, Instagram, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

export function ShareModal({ open, onClose, url, title }: ShareModalProps) {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Check out this property: ${title}\n${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareFacebook = () => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`;
    window.open(shareUrl, "_blank");
  };

  const shareX = () => {
    const text = encodeURIComponent(`Check out this property: ${title}`);
    const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank");
  };

  const shareInstagram = () => {
    // Instagram doesn't have a direct share link intent for web. 
    // Usually, users copy the link to put in their story/bio.
    handleCopyLink();
    toast.success("Link copied! Open Instagram to share.");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Share this property</DialogTitle>
          <DialogDescription className="font-body">
            Share this listing with your friends or family.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 mt-4">
          <div className="grid flex-1 gap-2 border rounded-md p-1">
            <Input
              id="link"
              defaultValue={url}
              readOnly
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent h-8 shadow-none"
            />
          </div>
          <Button type="button" size="sm" className="px-3" onClick={handleCopyLink}>
            <span className="sr-only">Copy</span>
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex justify-center gap-6 mt-6 pb-2">
          <button
            onClick={shareWhatsApp}
            className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="h-12 w-12 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-md">
              <MessageCircle className="h-6 w-6" />
            </div>
            <span className="text-xs font-body text-muted-foreground font-medium">WhatsApp</span>
          </button>
          
          <button
            onClick={shareInstagram}
            className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center text-white shadow-md">
              <Instagram className="h-6 w-6" />
            </div>
            <span className="text-xs font-body text-muted-foreground font-medium">Instagram</span>
          </button>
          
          <button
            onClick={shareFacebook}
            className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="h-12 w-12 rounded-full bg-[#1877F2] flex items-center justify-center text-white shadow-md">
              <Facebook className="h-6 w-6" />
            </div>
            <span className="text-xs font-body text-muted-foreground font-medium">Facebook</span>
          </button>

          <button
            onClick={shareX}
            className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center text-white shadow-md">
              <X className="h-6 w-6" />
            </div>
            <span className="text-xs font-body text-muted-foreground font-medium">X (Twitter)</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}