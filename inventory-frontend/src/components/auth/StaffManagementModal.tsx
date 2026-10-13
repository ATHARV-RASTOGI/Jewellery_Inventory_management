import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  KeyRound,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Lock,
  User,
  PowerOff,
  Power,
  RefreshCw,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import {
  apiFetchUsers,
  apiCreateUser,
  apiResetUserPassword,
  apiToggleUserStatus,
  type UserSummary,
} from "@/lib/api/auth";
import { toast } from "sonner";
import { useAuth } from "@/lib/authContext";

interface StaffManagementModalProps {
  open: boolean;
  onClose: () => void;
}

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  open,
  onClose,
}) => {
  const { user: currentAuthUser } = useAuth();

  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Create User Form State
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("ROLE_STAFF");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reset Password State
  const [resetTargetUser, setResetTargetUser] = useState<UserSummary | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await apiFetchUsers();
      setUsers(data);
    } catch {
      toast.error("Failed to load users list.");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanUsername = newUsername.trim();
    if (!cleanUsername) {
      setFormError("Username cannot be empty.");
      return;
    }
    if (newPassword.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiCreateUser({
        username: cleanUsername,
        password: newPassword,
        role: newRole,
      });

      toast.success(`User '${cleanUsername}' created successfully!`);
      setNewUsername("");
      setNewPassword("");
      setNewRole("ROLE_STAFF");
      loadUsers();
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response
      ) {
        const data = (err.response as { data: { error?: string } }).data;
        setFormError(data?.error || "Failed to create user.");
      } else {
        setFormError("Server error while creating user.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (userToToggle: UserSummary) => {
    if (userToToggle.username === currentAuthUser?.username) {
      toast.error("You cannot deactivate your own active account.");
      return;
    }

    try {
      const updated = await apiToggleUserStatus(userToToggle.id);
      toast.success(
        `User '${userToToggle.username}' is now ${updated.enabled ? "Active" : "Disabled"}.`
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === userToToggle.id ? updated : u))
      );
    } catch {
      toast.error("Failed to update user status.");
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    if (resetPasswordValue.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }

    setIsResetting(true);
    try {
      await apiResetUserPassword(resetTargetUser.id, resetPasswordValue);
      toast.success(`Password reset for '${resetTargetUser.username}' successfully!`);
      setResetTargetUser(null);
      setResetPasswordValue("");
    } catch {
      toast.error("Failed to reset password.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <span className="flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-500" />
          <span>Staff & User Management</span>
        </span>
      }
      subtitle="Create counter logins, manage roles, and reset credentials for staff."
    >
      <div className="space-y-6">
        {/* Top Section: Add New User Form */}
        <div className="p-4 rounded-lg bg-surface-2 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <UserPlus className="w-3.5 h-3.5 text-primary" />
              Add New Counter User
            </h4>
            <span className="text-[10px] text-muted-foreground font-mono">
              Access level: Store Administrator
            </span>
          </div>

          {formError && (
            <div className="p-2.5 rounded bg-danger-soft border border-danger/30 text-danger text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
            {/* Username Input */}
            <div className="sm:col-span-4 space-y-1">
              <label className="block text-[11px] font-semibold text-muted-foreground">
                Username
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. rohit_sales"
                  className="w-full bg-surface border border-border rounded h-8 pl-8 pr-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="sm:col-span-4 space-y-1">
              <label className="block text-[11px] font-semibold text-muted-foreground">
                Initial Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-surface border border-border rounded h-8 pl-8 pr-8 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Role Select */}
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-[11px] font-semibold text-muted-foreground">
                Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full bg-surface border border-border rounded h-8 px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="ROLE_STAFF">Staff</option>
                <option value="ROLE_ADMIN">Admin</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-8 rounded bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
              >
                {isSubmitting ? (
                  <div className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Bottom Section: Existing Users Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <span>Existing Users</span>
              <span className="text-muted-foreground font-normal">({users.length})</span>
            </h4>
            <button
              onClick={loadUsers}
              disabled={loadingUsers}
              title="Refresh users list"
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer text-xs flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${loadingUsers ? "animate-spin" : ""}`} />
              <span className="text-[11px]">Refresh</span>
            </button>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-2 border-b border-border text-[11px] text-muted-foreground font-semibold">
                <tr>
                  <th className="px-3.5 py-2">User</th>
                  <th className="px-3.5 py-2">Role</th>
                  <th className="px-3.5 py-2">Status</th>
                  <th className="px-3.5 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3.5 py-6 text-center text-muted-foreground">
                      {loadingUsers ? "Loading staff accounts..." : "No staff accounts found."}
                    </td>
                  </tr>
                )}
                {users.map((u) => {
                  const isSelf = u.username === currentAuthUser?.username;
                  const isAdmin = u.role === "ROLE_ADMIN";

                  return (
                    <tr key={u.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-surface-2 border border-border text-foreground flex items-center justify-center font-bold text-[10px] uppercase">
                            {u.username.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground">{u.username}</span>
                            {isSelf && (
                              <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">
                                (You)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${
                            isAdmin
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                              : "bg-surface-2 text-foreground border-border"
                          }`}
                        >
                          <Shield className="w-2.5 h-2.5" />
                          {u.role.replace("ROLE_", "")}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            u.enabled
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-danger-soft text-danger"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.enabled ? "bg-emerald-500" : "bg-danger"
                            }`}
                          />
                          {u.enabled ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Reset Password Button */}
                          <button
                            onClick={() => {
                              setResetTargetUser(u);
                              setResetPasswordValue("");
                            }}
                            className="p-1 rounded text-muted-foreground hover:text-amber-500 hover:bg-surface-2 transition-colors cursor-pointer"
                            title="Reset Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Active Status */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={isSelf}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              isSelf
                                ? "opacity-30 cursor-not-allowed text-muted-foreground"
                                : u.enabled
                                ? "text-danger hover:bg-danger-soft"
                                : "text-emerald-600 hover:bg-emerald-500/10"
                            }`}
                            title={
                              isSelf
                                ? "Cannot disable your own account"
                                : u.enabled
                                ? "Deactivate user"
                                : "Activate user"
                            }
                          >
                            {u.enabled ? (
                              <PowerOff className="w-3.5 h-3.5" />
                            ) : (
                              <Power className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Nested Reset Password Mini Dialog */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-lg bg-surface border border-border shadow-elevated p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <KeyRound className="w-4 h-4 text-amber-500" />
              <h5 className="text-xs font-semibold text-foreground">
                Reset Password for '{resetTargetUser.username}'
              </h5>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-muted-foreground">
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  placeholder="Enter temporary password"
                  className="w-full bg-surface-2 border border-border rounded h-8 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  disabled={isResetting}
                  className="px-2.5 h-7 rounded border border-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-2 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-3 h-7 rounded bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                >
                  {isResetting ? "Resetting..." : "Save Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Modal>
  );
};
