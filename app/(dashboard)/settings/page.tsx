"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "user";
};

type AppUser = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "user";
  isActive: boolean;
  createdAt?: string;
  lastLoginAt?: string;
};

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  const [passwordResetUserId, setPasswordResetUserId] = useState("");
  const [passwordResetValue, setPasswordResetValue] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const router = useRouter();

  const fetchMe = async () => {
    const res = await fetch("/api/auth/me");
    if (!res.ok) {
      setUser(null);
      return null;
    }

    const payload = (await res.json()) as { user: CurrentUser };
    setUser(payload.user);
    return payload.user;
  };

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    if (!res.ok) {
      setUsers([]);
      return;
    }

    const payload = (await res.json()) as AppUser[];
    setUsers(payload);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const me = await fetchMe();
        if (!me) return;

        if (me.role === "owner") {
          await fetchUsers();
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentPassword || !newPassword) {
      toast.error("Current and new password are required");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { message?: string } | null;
        toast.error(payload?.message || "Failed to change password");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password changed successfully");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newUserName || !newUserEmail || !newUserPassword) {
      toast.error("Name, email, and password are required");
      return;
    }

    setCreatingUser(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { message?: string } | null;
        toast.error(payload?.message || "Failed to create user");
        return;
      }

      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      toast.success("User created successfully");
      await fetchUsers();
    } finally {
      setCreatingUser(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!passwordResetUserId || !passwordResetValue) {
      toast.error("Select user and enter a new password");
      return;
    }

    setResettingPassword(true);
    try {
      const res = await fetch(`/api/users/${passwordResetUserId}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword: passwordResetValue,
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { message?: string } | null;
        toast.error(payload?.message || "Failed to update password");
        return;
      }

      setPasswordResetUserId("");
      setPasswordResetValue("");
      toast.success("User password updated");
    } finally {
      setResettingPassword(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
      setLogoutConfirmOpen(false);
    }
  };

  if (loading) {
    return <p className="text-gray-500">Loading settings...</p>;
  }

  return (
    <section className="space-y-6">
      <ConfirmDialog
        open={logoutConfirmOpen}
        title="Logout now?"
        description="You will be signed out from this device."
        confirmLabel="Logout"
        onConfirm={handleLogout}
        onCancel={() => {
          if (!loggingOut) setLogoutConfirmOpen(false);
        }}
        loading={loggingOut}
      />

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Settings</h2>
        <button
          type="button"
          onClick={() => setLogoutConfirmOpen(true)}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold hover:bg-gray-50 cursor-pointer"
        >
          Logout
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 space-y-2">
        <p className="text-sm text-gray-500">Logged in as</p>
        <p className="font-semibold">{user?.name || "-"}</p>
        <p className="text-sm text-gray-600">{user?.email || "-"}</p>
        <p className="text-xs uppercase tracking-wide text-[var(--primary)] font-semibold">
          {user?.role || "-"}
        </p>
      </div>

      <form onSubmit={handleChangePassword} className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <h3 className="font-semibold">Change My Password</h3>
        <div className="relative">
          <input
            type={showCurrentPassword ? "text" : "password"}
            placeholder="Current password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="input pr-10"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label={showCurrentPassword ? "Hide password" : "Show password"}
          >
            {showCurrentPassword ? <HiEyeOff className="text-lg" /> : <HiEye className="text-lg" />}
          </button>
        </div>
        <div className="relative">
          <input
            type={showNewPassword ? "text" : "password"}
            placeholder="New password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="input pr-10"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label={showNewPassword ? "Hide password" : "Show password"}
          >
            {showNewPassword ? <HiEyeOff className="text-lg" /> : <HiEye className="text-lg" />}
          </button>
        </div>
        <button
          type="submit"
          disabled={changingPassword}
          className="bg-[var(--primary)] text-white px-4 py-2 rounded-lg disabled:opacity-60"
        >
          {changingPassword ? "Updating..." : "Update Password"}
        </button>
      </form>

      {user?.role === "owner" ? (
        <>
          <form onSubmit={handleCreateUser} className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            <h3 className="font-semibold">Add Application User</h3>
            <input
              placeholder="Name"
              value={newUserName}
              onChange={(event) => setNewUserName(event.target.value)}
              className="input"
            />
            <input
              type="email"
              placeholder="Email"
              value={newUserEmail}
              onChange={(event) => setNewUserEmail(event.target.value)}
              className="input"
            />
            <div className="relative">
              <input
                type={showNewUserPassword ? "text" : "password"}
                placeholder="Temporary Password"
                value={newUserPassword}
                onChange={(event) => setNewUserPassword(event.target.value)}
                className="input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewUserPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showNewUserPassword ? "Hide password" : "Show password"}
              >
                {showNewUserPassword ? <HiEyeOff className="text-lg" /> : <HiEye className="text-lg" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={creatingUser}
              className="bg-[var(--primary)] text-white px-4 py-2 rounded-lg disabled:opacity-60"
            >
              {creatingUser ? "Creating..." : "Create User"}
            </button>
          </form>

          <form onSubmit={handleResetPassword} className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            <h3 className="font-semibold">Change User Password</h3>
            <select
              value={passwordResetUserId}
              onChange={(event) => setPasswordResetUserId(event.target.value)}
              className="input"
            >
              <option value="">Select user</option>
              {users
                .filter((entry) => entry.role === "user")
                .map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name} ({entry.email})
                  </option>
                ))}
            </select>
            <div className="relative">
              <input
                type={showResetPassword ? "text" : "password"}
                placeholder="New password"
                value={passwordResetValue}
                onChange={(event) => setPasswordResetValue(event.target.value)}
                className="input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowResetPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showResetPassword ? "Hide password" : "Show password"}
              >
                {showResetPassword ? <HiEyeOff className="text-lg" /> : <HiEye className="text-lg" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={resettingPassword}
              className="bg-[var(--primary)] text-white px-4 py-2 rounded-lg disabled:opacity-60"
            >
              {resettingPassword ? "Updating..." : "Update User Password"}
            </button>
          </form>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-black/10">
              <h3 className="font-semibold">Application Users</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-[var(--primary)] text-white uppercase text-xs">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-left">Last Login</th>
                </tr>
              </thead>
              <tbody>
                {users.map((entry) => (
                  <tr key={entry.id} className="border-t">
                    <td className="p-3 font-semibold">{entry.name}</td>
                    <td className="p-3">{entry.email}</td>
                    <td className="p-3 capitalize">{entry.role}</td>
                    <td className="p-3 text-gray-600">
                      {entry.lastLoginAt
                        ? new Date(entry.lastLoginAt).toLocaleString()
                        : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}
