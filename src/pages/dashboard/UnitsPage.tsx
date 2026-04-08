import { useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Plus, Trash2, Pencil, Check, X, Layers, Building2,
  ChevronDown, ChevronUp, Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api";
import { transformUnit } from "@/lib/propertyTransform";
import type { Unit } from "@/data/properties";
import { UNIT_TYPE_OPTIONS } from "@/data/properties";
import { generateMockUnits } from "@/data/mockUnits";

// ─── blank row for inline add/edit ─────────────────────────────────────────
interface UnitDraft {
  id?: string;           // present only when editing existing unit
  unitNumber: string;
  floorNumber: string;
  unitType: string;
  monthlyRent: string;
  serviceCharge: string;
  status: "vacant" | "occupied";
  notes: string;
}

const emptyDraft = (): UnitDraft => ({
  unitNumber: "",
  floorNumber: "",
  unitType: "",
  monthlyRent: "",
  serviceCharge: "",
  status: "vacant",
  notes: "",
});

function draftFromUnit(u: Unit): UnitDraft {
  return {
    id: u.id,
    unitNumber: u.unitNumber,
    floorNumber: u.floorNumber !== undefined ? String(u.floorNumber) : "",
    unitType: u.type,
    monthlyRent: String(u.price),
    serviceCharge: u.serviceCharge !== undefined ? String(u.serviceCharge) : "",
    status: u.status,
    notes: u.notes || "",
  };
}

function draftToPayload(d: UnitDraft) {
  return {
    unitNumber: d.unitNumber.trim(),
    floorNumber: d.floorNumber !== "" ? Number(d.floorNumber) : undefined,
    unitType: d.unitType,
    monthlyRent: Number(d.monthlyRent),
    serviceCharge: d.serviceCharge !== "" ? Number(d.serviceCharge) : 0,
    status: d.status,
    notes: d.notes.trim() || undefined,
  };
}

function isValidDraft(d: UnitDraft): boolean {
  return !!(d.unitNumber.trim() && d.unitType && d.monthlyRent && Number(d.monthlyRent) > 0);
}

// ─── Status badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: "vacant" | "occupied" }) {
  return (
    <Badge
      variant={status === "vacant" ? "default" : "secondary"}
      className={status === "vacant" ? "bg-success text-success-foreground" : ""}
    >
      {status === "vacant" ? "Vacant" : "Occupied"}
    </Badge>
  );
}

// ─── Inline editable row ───────────────────────────────────────────────────
function UnitEditRow({
  draft,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  draft: UnitDraft;
  onChange: (d: UnitDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <TableRow className="bg-muted/40">
      <TableCell>
        <Input
          value={draft.unitNumber}
          onChange={(e) => onChange({ ...draft, unitNumber: e.target.value })}
          placeholder="e.g. A1"
          className="h-8 w-24"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={draft.floorNumber}
          onChange={(e) => onChange({ ...draft, floorNumber: e.target.value })}
          placeholder="0"
          className="h-8 w-16"
          min={0}
        />
      </TableCell>
      <TableCell>
        <Select value={draft.unitType} onValueChange={(v) => onChange({ ...draft, unitType: v })}>
          <SelectTrigger className="h-8 w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {UNIT_TYPE_OPTIONS.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">KES</span>
          <Input
            type="number"
            value={draft.monthlyRent}
            onChange={(e) => onChange({ ...draft, monthlyRent: e.target.value })}
            placeholder="0"
            className="h-8 w-28 pl-9"
            min={0}
            step={500}
          />
        </div>
      </TableCell>
      <TableCell>
        <Select value={draft.status} onValueChange={(v) => onChange({ ...draft, status: v as "vacant" | "occupied" })}>
          <SelectTrigger className="h-8 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vacant">Vacant</SelectItem>
            <SelectItem value="occupied">Occupied</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            className="h-7 px-2 bg-secondary hover:bg-orange-dark text-secondary-foreground"
            onClick={onSave}
            disabled={saving || !isValidDraft(draft)}
          >
            {saving ? (
              <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onCancel}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─── Bulk generate dialog ─────────────────────────────────────────────────
interface BulkConfig {
  unitType: string;
  monthlyRent: string;
  serviceCharge: string;
  floorStart: string;
  floorEnd: string;
  unitsPerFloor: string;
  prefix: string;
}

function BulkGenerateDialog({
  open,
  onClose,
  onGenerate,
  generating,
}: {
  open: boolean;
  onClose: () => void;
  onGenerate: (units: ReturnType<typeof draftToPayload>[]) => void;
  generating: boolean;
}) {
  const [cfg, setCfg] = useState<BulkConfig>({
    unitType: "",
    monthlyRent: "",
    serviceCharge: "",
    floorStart: "1",
    floorEnd: "3",
    unitsPerFloor: "4",
    prefix: "",
  });

  const preview = useCallback(() => {
    const fs = Number(cfg.floorStart);
    const fe = Number(cfg.floorEnd);
    const upf = Number(cfg.unitsPerFloor);
    if (!cfg.unitType || !cfg.monthlyRent || isNaN(fs) || isNaN(fe) || isNaN(upf) || upf < 1) return 0;
    return (fe - fs + 1) * upf;
  }, [cfg]);

  const handleGenerate = () => {
    const fs = Number(cfg.floorStart);
    const fe = Number(cfg.floorEnd);
    const upf = Number(cfg.unitsPerFloor);
    if (!cfg.unitType || !cfg.monthlyRent || isNaN(fs) || isNaN(fe) || isNaN(upf) || upf < 1) {
      toast.error("Fill in all required fields");
      return;
    }
    const units: ReturnType<typeof draftToPayload>[] = [];
    for (let floor = fs; floor <= fe; floor++) {
      for (let u = 1; u <= upf; u++) {
        const unitNumber = `${cfg.prefix || floor}${u.toString().padStart(2, "0")}`;
        units.push({
          unitNumber,
          floorNumber: floor,
          unitType: cfg.unitType,
          monthlyRent: Number(cfg.monthlyRent),
          serviceCharge: cfg.serviceCharge !== "" ? Number(cfg.serviceCharge) : 0,
          status: "vacant",
          notes: undefined,
        });
      }
    }
    onGenerate(units);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-secondary" /> Bulk Generate Units
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Unit Type *</Label>
              <Select value={cfg.unitType} onValueChange={(v) => setCfg((c) => ({ ...c, unitType: v }))}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {UNIT_TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Unit Number Prefix</Label>
              <Input
                value={cfg.prefix}
                onChange={(e) => setCfg((c) => ({ ...c, prefix: e.target.value }))}
                placeholder="e.g. A (→ A01, A02…)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Monthly Rent (KES) *</Label>
              <Input
                type="number"
                value={cfg.monthlyRent}
                onChange={(e) => setCfg((c) => ({ ...c, monthlyRent: e.target.value }))}
                placeholder="0"
                min={0}
                step={500}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Service Charge (KES)</Label>
              <Input
                type="number"
                value={cfg.serviceCharge}
                onChange={(e) => setCfg((c) => ({ ...c, serviceCharge: e.target.value }))}
                placeholder="0"
                min={0}
                step={500}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Floor from *</Label>
              <Input
                type="number"
                value={cfg.floorStart}
                onChange={(e) => setCfg((c) => ({ ...c, floorStart: e.target.value }))}
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Floor to *</Label>
              <Input
                type="number"
                value={cfg.floorEnd}
                onChange={(e) => setCfg((c) => ({ ...c, floorEnd: e.target.value }))}
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Units / floor *</Label>
              <Input
                type="number"
                value={cfg.unitsPerFloor}
                onChange={(e) => setCfg((c) => ({ ...c, unitsPerFloor: e.target.value }))}
                min={1}
              />
            </div>
          </div>

          {preview() > 0 && (
            <p className="text-sm text-muted-foreground font-body">
              This will create <strong className="text-foreground">{preview()} units</strong>.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleGenerate}
            disabled={generating || preview() === 0}
            className="bg-secondary hover:bg-orange-dark text-secondary-foreground"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" /> Generate {preview() > 0 ? `${preview()} Units` : "Units"}
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function UnitsPage() {
  const { id: propertyId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [addingRow, setAddingRow] = useState<UnitDraft | null>(null);
  const [editingRow, setEditingRow] = useState<UnitDraft | null>(null);
  const [showBulk, setShowBulk] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Fetch property summary ─────────────────────────────────────────────
  const { data: propertyRaw } = useQuery({
    queryKey: ["editProperty", propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data } = await api.get(`/properties/${propertyId}`);
      return data.data;
    },
  });

  // ── Fetch units (falls back to mock data when backend endpoint isn't ready) ──
  const { data: unitsRaw = [], isLoading: loadingUnits } = useQuery({
    queryKey: ["propertyUnits", propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      try {
        const { data } = await api.get(`/properties/${propertyId}/units`);
        const list = data.data || [];
        return list.length > 0 ? list : generateMockUnits(propertyId!);
      } catch {
        return generateMockUnits(propertyId!);
      }
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const units: Unit[] = (unitsRaw as any[]).map(transformUnit);
  const vacantCount = units.filter((u) => u.status === "vacant").length;
  const startingPrice = units.length > 0 ? Math.min(...units.map((u) => u.price)) : 0;

  // ── Mutations ──────────────────────────────────────────────────────────
  const createUnit = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post(`/properties/${propertyId}/units`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["propertyUnits", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["myProperties"] });
      setAddingRow(null);
      toast.success("Unit added");
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const updateUnit = useMutation({
    mutationFn: ({ unitId, payload }: { unitId: string; payload: Record<string, unknown> }) =>
      api.patch(`/properties/${propertyId}/units/${unitId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["propertyUnits", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["myProperties"] });
      setEditingRow(null);
      toast.success("Unit updated");
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const deleteUnit = useMutation({
    mutationFn: (unitId: string) =>
      api.delete(`/properties/${propertyId}/units/${unitId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["propertyUnits", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["myProperties"] });
      toast.success("Unit deleted");
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const bulkCreate = useMutation({
    mutationFn: (unitsList: Record<string, unknown>[]) =>
      api.post(`/properties/${propertyId}/units/bulk`, { units: unitsList }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["propertyUnits", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["myProperties"] });
      setShowBulk(false);
      toast.success(`${vars.length} units created`);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleSaveAdd = () => {
    if (!addingRow || !isValidDraft(addingRow)) return;
    createUnit.mutate(draftToPayload(addingRow) as Record<string, unknown>);
  };

  const handleSaveEdit = () => {
    if (!editingRow?.id || !isValidDraft(editingRow)) return;
    updateUnit.mutate({ unitId: editingRow.id, payload: draftToPayload(editingRow) as Record<string, unknown> });
  };

  const handleDelete = (unit: Unit) => {
    if (!window.confirm(`Delete unit "${unit.unitNumber}"? This cannot be undone.`)) return;
    deleteUnit.mutate(unit.id);
  };

  const handleBulkGenerate = (unitsList: ReturnType<typeof draftToPayload>[]) => {
    bulkCreate.mutate(unitsList as Record<string, unknown>[]);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard/properties">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6 text-muted-foreground" />
              {propertyRaw ? propertyRaw.title : "Property Units"}
            </h1>
            {propertyRaw && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {propertyRaw.neighborhood}, {propertyRaw.county}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => setShowBulk(true)}
            className="hidden sm:flex"
          >
            <Wand2 className="h-4 w-4 mr-2" /> Bulk Generate
          </Button>
          <Button
            onClick={() => { setEditingRow(null); setAddingRow(emptyDraft()); }}
            className="bg-secondary hover:bg-orange-dark text-secondary-foreground"
            disabled={!!addingRow}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Unit
          </Button>
        </div>
      </div>

      {/* Stats */}
      {units.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-2xl font-heading font-bold">{units.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Units</p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-2xl font-heading font-bold text-success">{vacantCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Vacant</p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-2xl font-heading font-bold text-secondary">
              {startingPrice > 0 ? `KES ${startingPrice.toLocaleString()}` : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Starting Price</p>
          </div>
        </div>
      )}

      {/* Edit property link */}
      {propertyId && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Layers className="h-4 w-4" />
          <span>Property details:</span>
          <Link
            to={`/dashboard/properties/${propertyId}/edit`}
            className="text-secondary hover:underline font-medium"
          >
            Edit property info
          </Link>
          <span className="mx-1">·</span>
          <Link
            to={`/marketplace/${propertyId}`}
            className="text-secondary hover:underline font-medium"
          >
            Preview listing
          </Link>
        </div>
      )}

      <Separator />

      {/* Units table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Unit #</TableHead>
              <TableHead className="w-20">Floor</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price / month</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Add-new row (shown at top) */}
            {addingRow && (
              <UnitEditRow
                draft={addingRow}
                onChange={setAddingRow}
                onSave={handleSaveAdd}
                onCancel={() => setAddingRow(null)}
                saving={createUnit.isPending}
              />
            )}

            {loadingUnits ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <div className="h-10 bg-muted rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : units.length === 0 && !addingRow ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-14 text-muted-foreground">
                  <div className="flex flex-col items-center gap-3">
                    <Building2 className="h-10 w-10 text-muted-foreground/40" />
                    <p className="font-body">No units yet.</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setAddingRow(emptyDraft())}
                        className="bg-secondary hover:bg-orange-dark text-secondary-foreground"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Add a unit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowBulk(true)}>
                        <Wand2 className="h-3.5 w-3.5 mr-1.5" /> Bulk generate
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              units.map((unit) => {
                const isEditing = editingRow?.id === unit.id;
                if (isEditing && editingRow) {
                  return (
                    <UnitEditRow
                      key={unit.id}
                      draft={editingRow}
                      onChange={setEditingRow}
                      onSave={handleSaveEdit}
                      onCancel={() => setEditingRow(null)}
                      saving={updateUnit.isPending}
                    />
                  );
                }
                const isExpanded = expandedId === unit.id;
                return (
                  <>
                    <TableRow key={unit.id} className="group">
                      <TableCell className="font-medium font-body">{unit.unitNumber}</TableCell>
                      <TableCell className="text-muted-foreground font-body">
                        {unit.floorNumber !== undefined ? `Floor ${unit.floorNumber}` : "—"}
                      </TableCell>
                      <TableCell className="font-body">{unit.typeLabel}</TableCell>
                      <TableCell className="font-medium font-body">
                        KES {unit.price.toLocaleString()}
                        {unit.serviceCharge ? (
                          <span className="text-xs text-muted-foreground ml-1">
                            + {unit.serviceCharge.toLocaleString()} sc
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={unit.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {unit.notes && (
                            <button
                              className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
                              onClick={() => setExpandedId(isExpanded ? null : unit.id)}
                              title="Notes"
                            >
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </button>
                          )}
                          <button
                            className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
                            onClick={() => { setAddingRow(null); setEditingRow(draftFromUnit(unit)); }}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="h-7 w-7 rounded-md hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(unit)}
                            disabled={deleteUnit.isPending}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && unit.notes && (
                      <TableRow key={`${unit.id}-notes`} className="bg-muted/30">
                        <TableCell colSpan={6} className="text-sm text-muted-foreground font-body py-2 pl-6">
                          {unit.notes}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bulk generate on mobile */}
      <div className="sm:hidden">
        <Button variant="outline" className="w-full" onClick={() => setShowBulk(true)}>
          <Wand2 className="h-4 w-4 mr-2" /> Bulk Generate Units
        </Button>
      </div>

      {/* Bulk dialog */}
      <BulkGenerateDialog
        open={showBulk}
        onClose={() => setShowBulk(false)}
        onGenerate={handleBulkGenerate}
        generating={bulkCreate.isPending}
      />
    </div>
  );
}
