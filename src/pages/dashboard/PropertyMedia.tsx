import { useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, X, Star, Trash2, GripVertical, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { mockProperties } from "@/data/properties";

interface UploadFile { id: string; file: File; preview: string; progress: number; status: "pending" | "uploading" | "done" | "error"; }
interface UploadedImage { id: string; url: string; isCover: boolean; }

export default function PropertyMedia() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<UploadFile[]>([]);
  const [uploaded, setUploaded] = useState<UploadedImage[]>([
    { id: "img1", url: mockProperties[0]?.images[0] ?? "", isCover: true },
    { id: "img2", url: mockProperties[0]?.images[1] ?? "", isCover: false },
  ].filter((i) => i.url));

  const property = mockProperties.find((p) => p.id === id) ?? mockProperties[0];

  function validateFiles(files: FileList | null) {
    if (!files) return;
    const valid: UploadFile[] = [];
    Array.from(files).forEach((file) => {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast({ title: "Invalid file type", description: `${file.name} is not a valid image.`, variant: "destructive" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: `${file.name} exceeds 5MB.`, variant: "destructive" });
        return;
      }
      const preview = URL.createObjectURL(file);
      valid.push({ id: crypto.randomUUID(), file, preview, progress: 0, status: "pending" });
    });
    setQueue((q) => [...q, ...valid]);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    validateFiles(e.dataTransfer.files);
  }, []);

  function uploadAll() {
    setQueue((q) => q.map((f) => ({ ...f, status: "uploading", progress: 0 })));
    queue.forEach((item) => {
      let prog = 0;
      const interval = setInterval(() => {
        prog += Math.floor(Math.random() * 20 + 10);
        if (prog >= 100) {
          prog = 100;
          clearInterval(interval);
          setQueue((q) =>
            q.map((f) => f.id === item.id ? { ...f, progress: 100, status: "done" } : f)
          );
          setUploaded((u) => [...u, { id: item.id, url: item.preview, isCover: u.length === 0 }]);
          setQueue((q) => q.filter((f) => f.id !== item.id));
        } else {
          setQueue((q) => q.map((f) => f.id === item.id ? { ...f, progress: prog } : f));
        }
      }, 200);
    });
  }

  function removeQueued(id: string) {
    setQueue((q) => q.filter((f) => f.id !== id));
  }

  function setCover(id: string) {
    setUploaded((u) => u.map((img) => ({ ...img, isCover: img.id === id })));
    toast({ title: "Cover photo updated" });
  }

  function deleteUploaded(id: string) {
    setUploaded((u) => {
      const remaining = u.filter((img) => img.id !== id);
      if (remaining.length > 0 && !remaining.some((img) => img.isCover)) {
        remaining[0].isCover = true;
      }
      return remaining;
    });
    toast({ title: "Photo deleted" });
  }

  const total = uploaded.length;
  const minWarning = total < 3;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/properties`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold">Manage Photos</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-muted-foreground">{total} / 20 photos uploaded</p>
            {minWarning && (
              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-xs gap-1">
                <AlertCircle className="h-3 w-3" />
                Add at least 3 photos to publish
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${dragging ? "border-secondary bg-secondary/5" : "border-border hover:border-secondary/60"}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-medium">Drag photos here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP · Max 5MB per file · Up to 20 images</p>
          </div>
        </CardContent>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => validateFiles(e.target.files)} />
      </Card>

      {/* Upload Queue */}
      {queue.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-sm">Ready to upload ({queue.length})</h2>
            <Button size="sm" className="bg-secondary hover:bg-secondary/90" onClick={uploadAll}>
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Upload All
            </Button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {queue.map((item) => (
              <div key={item.id} className="shrink-0 w-36 space-y-1.5">
                <div className="relative h-24 rounded-lg overflow-hidden bg-muted">
                  <img src={item.preview} alt="" className="w-full h-full object-cover" />
                  {item.status === "uploading" && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs font-medium">{item.progress}%</span>
                    </div>
                  )}
                  <button className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center" onClick={(e) => { e.stopPropagation(); removeQueued(item.id); }}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
                {item.status === "uploading" && <Progress value={item.progress} className="h-1" />}
                <p className="text-xs text-muted-foreground truncate">{item.file.name}</p>
                <p className="text-xs text-muted-foreground">{(item.file.size / 1024).toFixed(0)} KB</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Images Grid */}
      {uploaded.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-medium text-sm">Uploaded Photos ({uploaded.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {uploaded.map((img) => (
              <div key={img.id} className="relative group rounded-lg overflow-hidden bg-muted aspect-video">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                {img.isCover && (
                  <Badge className="absolute top-2 left-2 bg-secondary text-secondary-foreground text-xs">Cover</Badge>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${img.isCover ? "bg-secondary text-white" : "bg-white/80 hover:bg-secondary hover:text-white"}`}
                    onClick={() => setCover(img.id)}
                    title="Set as cover"
                  >
                    <Star className="h-4 w-4" />
                  </button>
                  <button
                    className="h-8 w-8 rounded-full bg-white/80 hover:bg-destructive hover:text-white flex items-center justify-center transition-colors"
                    onClick={() => deleteUploaded(img.id)}
                    title="Delete photo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 cursor-grab">
                  <GripVertical className="h-4 w-4 text-white drop-shadow" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <div className="flex justify-end pt-2">
        <Button className="bg-primary hover:bg-primary/90" onClick={() => navigate(`/dashboard/properties`)}>
          Done — View Properties
        </Button>
      </div>
    </div>
  );
}
