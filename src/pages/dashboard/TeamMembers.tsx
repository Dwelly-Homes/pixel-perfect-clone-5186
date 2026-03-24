import { useState } from "react";
import { Link } from "react-router-dom";
import {
  UserPlus, Search, MoreVertical, Mail, Shield, UserCheck, UserX, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";

const mockTeam = [
  { id: "1", name: "James Mwangi", email: "james@dwelly.co.ke", role: "Admin", status: "Active", joined: "2024-01-10", initials: "JM" },
  { id: "2", name: "Alice Wanjiku", email: "alice@dwelly.co.ke", role: "Agent", status: "Active", joined: "2024-02-15", initials: "AW" },
  { id: "3", name: "Peter Otieno", email: "peter@dwelly.co.ke", role: "Agent", status: "Active", joined: "2024-03-01", initials: "PO" },
  { id: "4", name: "Grace Akinyi", email: "grace@dwelly.co.ke", role: "Caretaker", status: "Pending Invite", joined: "2024-06-20", initials: "GA" },
  { id: "5", name: "David Kamau", email: "david@dwelly.co.ke", role: "Agent", status: "Suspended", joined: "2024-04-05", initials: "DK" },
];

const roleBadgeColor: Record<string, string> = {
  Admin: "bg-primary text-primary-foreground",
  Agent: "bg-blue-100 text-blue-800",
  Caretaker: "bg-gray-100 text-gray-700",
};

const statusDot: Record<string, string> = {
  Active: "bg-green-500",
  "Pending Invite": "bg-yellow-500",
  Suspended: "bg-red-500",
};

export default function TeamMembers() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [team, setTeam] = useState(mockTeam);
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [selected, setSelected] = useState<(typeof mockTeam)[0] | null>(null);
  const [newRole, setNewRole] = useState("");

  const filtered = team.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  function handleChangeRole() {
    if (!selected || !newRole) return;
    setTeam((prev) =>
      prev.map((m) => (m.id === selected.id ? { ...m, role: newRole } : m))
    );
    setChangeRoleOpen(false);
    toast({ title: "Role updated", description: `${selected.name} is now ${newRole}` });
  }

  function handleRemove() {
    if (!selected) return;
    setTeam((prev) => prev.filter((m) => m.id !== selected.id));
    setRemoveOpen(false);
    toast({ title: "Member removed", description: `${selected.name} has been removed.` });
  }

  function handleSuspend(member: (typeof mockTeam)[0]) {
    setTeam((prev) =>
      prev.map((m) =>
        m.id === member.id
          ? { ...m, status: m.status === "Suspended" ? "Active" : "Suspended" }
          : m
      )
    );
    toast({ title: member.status === "Suspended" ? "Member reactivated" : "Member suspended" });
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
          {filtered.length === 0 ? (
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
                  {filtered.map((member) => (
                    <tr key={member.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                              {member.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{member.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          {member.email}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadgeColor[member.role]}`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${statusDot[member.status]}`} />
                          <span className="text-xs">{member.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(member.joined).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
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
                            <DropdownMenuItem onClick={() => handleSuspend(member)}>
                              {member.status === "Suspended" ? (
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
                  ))}
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
            <p className="text-sm text-muted-foreground">Update role for <strong>{selected?.name}</strong></p>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Agent">Agent</SelectItem>
                <SelectItem value="Caretaker">Caretaker</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeRoleOpen(false)}>Cancel</Button>
            <Button onClick={handleChangeRole} className="bg-secondary hover:bg-secondary/90">Save</Button>
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
            Are you sure you want to remove <strong>{selected?.name}</strong> from your team? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRemove}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
