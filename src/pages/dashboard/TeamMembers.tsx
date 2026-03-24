import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserPlus, Search, MoreVertical, Mail, Shield, UserCheck, UserX, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api";

const roleBadgeColor: Record<string, string> = {
  tenant_admin: "bg-primary text-primary-foreground",
  agent_staff: "bg-blue-100 text-blue-800",
  caretaker: "bg-gray-100 text-gray-700",
};

const roleLabel: Record<string, string> = {
  tenant_admin: "Admin",
  agent_staff: "Agent",
  caretaker: "Caretaker",
};

const statusDot: Record<string, string> = {
  active: "bg-green-500",
  pending: "bg-yellow-500",
  suspended: "bg-red-500",
  invited: "bg-yellow-500",
};

const statusLabel: Record<string, string> = {
  active: "Active",
  pending: "Pending Invite",
  suspended: "Suspended",
  invited: "Pending Invite",
};

export default function TeamMembers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selected, setSelected] = useState<any | null>(null);
  const [newRole, setNewRole] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["teamMembers"],
    queryFn: async () => {
      const { data } = await api.get("/users");
      return data.data || [];
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/users/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      setChangeRoleOpen(false);
      toast.success(`${selected?.fullName} is now ${roleLabel[newRole] || newRole}`);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const toggleStatusMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (member: any) => api.patch(`/users/${member._id}/toggle-status`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSuccess: (_: any, member: any) => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      toast.success(member.status === "suspended" ? "Member reactivated" : "Member suspended");
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      setRemoveOpen(false);
      toast.success(`${selected?.fullName} has been removed.`);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const team: any[] = data || [];
  const filtered = team.filter(
    (m) =>
      m.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase())
  );

  function handleChangeRole() {
    if (!selected || !newRole) return;
    updateRoleMutation.mutate({ id: selected._id, role: newRole });
  }

  function handleRemove() {
    if (!selected) return;
    removeMutation.mutate(selected._id);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Team Members</h1>
          <p className="text-sm text-muted-foreground mt-1">{team.length} members</p>
        </div>
        <Button asChild className="bg-secondary hover:bg-secondary/90">
          <Link to="/dashboard/team/invite">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <UserPlus className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">Your team is empty</p>
              <p className="text-sm text-muted-foreground mb-4">Invite your first agent to get started.</p>
              <Button asChild size="sm" className="bg-secondary hover:bg-secondary/90">
                <Link to="/dashboard/team/invite">Invite Member</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Member</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date Added</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {filtered.map((member: any) => {
                    const initials = member.fullName
                      ? member.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                      : "??";
                    return (
                      <tr key={member._id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{member.fullName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" />
                            {member.email}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadgeColor[member.role] || "bg-gray-100 text-gray-700"}`}>
                            {roleLabel[member.role] || member.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${statusDot[member.status] || "bg-gray-400"}`} />
                            <span className="text-xs">{statusLabel[member.status] || member.status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {new Date(member.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => { setSelected(member); setNewRole(member.role); setChangeRoleOpen(true); }}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleStatusMutation.mutate(member)}>
                                {member.status === "suspended" ? (
                                  <><UserCheck className="h-4 w-4 mr-2" />Reactivate</>
                                ) : (
                                  <><UserX className="h-4 w-4 mr-2" />Suspend</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => { setSelected(member); setRemoveOpen(true); }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove from Team
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Role Dialog */}
      <Dialog open={changeRoleOpen} onOpenChange={setChangeRoleOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Update role for <strong>{selected?.fullName}</strong></p>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tenant_admin">Admin</SelectItem>
                <SelectItem value="agent_staff">Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeRoleOpen(false)}>Cancel</Button>
            <Button onClick={handleChangeRole} disabled={updateRoleMutation.isPending} className="bg-secondary hover:bg-secondary/90">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Dialog */}
      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to remove <strong>{selected?.fullName}</strong> from your team? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={removeMutation.isPending} onClick={handleRemove}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
