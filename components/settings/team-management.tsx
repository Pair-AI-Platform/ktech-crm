"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Search,
  ShieldCheck,
  Edit,
  UserPlus,
  Target,
  Check,
  User,
} from "lucide-react";
import { toast } from "sonner";
import type { Profile } from "@/types";
import {
  useUserAnalytics,
  useUsers,
  useUpdateUserActive,
  useUpdateUserManagement,
  type User as ApiUser,
} from "@/lib/hooks/use-users";
import { useSendInvitation } from "@/lib/hooks/use-invitations";
import { useRoles } from "@/lib/hooks/use-roles";
import type { CreateInvitationRequest } from "@/lib/invitations/types";

interface TeamManagementProps {
  currentUser: Profile | null;
}

export function TeamManagement({ currentUser }: TeamManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ApiUser | null>(null);

  // Fetch analytics
  const { analytics, loading: analyticsLoading } = useUserAnalytics();

  // Fetch users with search filter
  const { users, loading: usersLoading } = useUsers(
    searchQuery ? { search: searchQuery } : undefined,
  );

  // Mutations
  const updateActiveMutation = useUpdateUserActive();
  const updateManagementMutation = useUpdateUserManagement();

  const loading = analyticsLoading || usersLoading;

  const handleEditMember = (member: ApiUser) => {
    setSelectedMember(member);
    setShowEditModal(true);
  };

  const handleToggleActive = async (member: ApiUser) => {
    await updateActiveMutation.mutateAsync({
      id: member.id,
      active: !member.active,
    });
  };

  const stats = {
    total: analytics?.totalMembers || 0,
    active: analytics?.activeMembers || 0,
    admins: analytics?.admins || 0,
    agents: analytics?.agents || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Team Management
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Manage team members and permissions
          </p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {stats.total}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Total Members
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#5a71c4]/15 flex items-center justify-center">
                <Check className="w-5 h-5 text-[#5a71c4]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {stats.active}
                </p>
                <p className="text-xs text-[var(--text-muted)]">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#212e7f]/15 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#212e7f]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {stats.admins}
                </p>
                <p className="text-xs text-[var(--text-muted)]">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#445eb7]/15 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#445eb7]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {stats.agents}
                </p>
                <p className="text-xs text-[var(--text-muted)]">Agents</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <Input
          placeholder="Search team members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Team Members List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
              <p className="text-[var(--text-muted)]">No team members found</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {users.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-[var(--bg-sunken)] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={member.profilePic || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 text-[var(--primary)]">
                            {member.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={cn(
                            "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--bg-elevated)]",
                            member.active
                              ? "bg-[var(--success)]"
                              : "bg-[#212e7f]",
                          )}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {member.name || "Unknown User"}
                          </p>
                          {member.id === currentUser?.id && (
                            <Badge variant="secondary" className="text-[10px]">
                              You
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-(--text-muted)">
                          {member.email || "No email"}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge
                            variant={
                              member.roleName?.toLowerCase() === "admin"
                                ? "info"
                                : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {member.roleName?.toLowerCase() === "admin" ? (
                              <ShieldCheck className="w-3 h-3 mr-1" />
                            ) : (
                              <Users className="w-3 h-3 mr-1" />
                            )}
                            {member.roleName || "No Role"}
                          </Badge>
                          {member.monthlyTarget > 0 && (
                            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {member.monthlyTarget}/month
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-muted)]">
                          Active
                        </span>
                        <Switch
                          checked={member.active}
                          onCheckedChange={() => handleToggleActive(member)}
                          disabled={
                            member.id === currentUser?.id ||
                            updateActiveMutation.isPending
                          }
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditMember(member)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Modal */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />

      {/* Edit Modal */}
      <EditMemberModal
        member={selectedMember}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMember(null);
        }}
        updateManagementMutation={updateManagementMutation}
      />
    </div>
  );
}

// Invite Member Modal
function InviteMemberModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [roleId, setRoleId] = useState("");
  const [monthlyTarget, setMonthlyTarget] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fetch available roles
  const { roles, loading: rolesLoading } = useRoles();
  // Send invitation mutation
  const sendInvitationMutation = useSendInvitation();

  const handleSubmit = async () => {
    if (!email || !fullName || !roleId) return;

    setError(null);

    const invitationData: CreateInvitationRequest = {
      email,
      name: fullName,
      roleId,
      monthlyTarget: monthlyTarget ? parseInt(monthlyTarget, 10) : 0,
    };

    try {
      await sendInvitationMutation.mutateAsync(invitationData);

      // Success feedback
      toast.success("Invitation sent successfully");

      // Clear form and close modal
      setEmail("");
      setFullName("");
      setRoleId("");
      setMonthlyTarget("");
      onClose();
    } catch (err) {
      // Error handling
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send invitation";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const isFormValid = email && fullName && roleId;
  const isSubmitting = sendInvitationMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px] overflow-hidden p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[var(--primary)]" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join the team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 pt-2">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Full Name
            </label>
            <Input
              placeholder="Enter full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="name@ktech.edu.kw"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Role
            </label>
            <Select
              value={roleId}
              onValueChange={setRoleId}
              disabled={isSubmitting || rolesLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    rolesLoading ? "Loading roles..." : "Select a role"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex items-center gap-2">
                      {role.name.toLowerCase() === "admin" ? (
                        <ShieldCheck className="w-4 h-4" />
                      ) : (
                        <Users className="w-4 h-4" />
                      )}
                      {role.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Monthly Target{" "}
              <span className="text-xs font-normal text-[var(--text-muted)]">
                (optional)
              </span>
            </label>
            <Input
              type="number"
              min={0}
              placeholder="Leave empty for trainees"
              value={monthlyTarget}
              onChange={(e) => setMonthlyTarget(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 pb-6 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting ? "Sending..." : "Send Invitation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Edit Member Modal
function EditMemberModal({
  member,
  isOpen,
  onClose,
  updateManagementMutation,
}: {
  member: ApiUser | null;
  isOpen: boolean;
  onClose: () => void;
  updateManagementMutation: ReturnType<typeof useUpdateUserManagement>;
}) {
  const [roleId, setRoleId] = useState("");
  const [monthlyTarget, setMonthlyTarget] = useState("20");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { roles, loading: rolesLoading } = useRoles();
  useEffect(() => {
    if (member) {
      setRoleId(member.roleId);
      setMonthlyTarget(String(member.monthlyTarget));
    }
  }, [member]);

  const handleSubmit = async () => {
    if (!member) return;
    setIsSubmitting(true);

    try {
      await updateManagementMutation.mutateAsync({
        id: member.id,
        payload: {
          monthlyTarget: parseInt(monthlyTarget) || 0,
          roleId,
        },
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px] overflow-hidden p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-[var(--primary)]" />
            Edit Team Member
          </DialogTitle>
          <DialogDescription>
            Update {member.name || "user"}&apos;s settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-sunken)]">
            <Avatar className="w-12 h-12">
              <AvatarImage src={member.profilePic || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 text-[var(--primary)]">
                {member.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() || "??"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-[var(--text-primary)]">
                {member.name || "Unknown User"}
              </p>
              <p className="text-sm text-(--text-muted)">
                {member.email || "No email"}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Role
            </label>
            <Select
              value={roleId}
              onValueChange={setRoleId}
              disabled={isSubmitting || rolesLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    rolesLoading ? "Loading roles..." : "Select a role"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex items-center gap-2">
                      {role.name.toLowerCase() === "admin" ? (
                        <ShieldCheck className="w-4 h-4" />
                      ) : (
                        <Users className="w-4 h-4" />
                      )}
                      {role.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Monthly Target{" "}
              <span className="text-xs font-normal text-[var(--text-muted)]">
                (optional)
              </span>
            </label>
            <Input
              type="number"
              min={0}
              placeholder="Leave empty for trainees"
              value={monthlyTarget}
              onChange={(e) => setMonthlyTarget(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 pb-6 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
