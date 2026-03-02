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

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);

  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

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

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await fetchMe();
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    setProfileName(user?.name || "");
    setProfileEmail(user?.email || "");
  }, [user]);

  const handleUpdateProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profileName.trim() || !profileEmail.trim()) {
      toast.error("Name and email are required");
      return;
    }

    setUpdatingProfile(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profileName.trim(),
          email: profileEmail.trim(),
        }),
      });

      const payload = (await res.json().catch(() => null)) as
        | { message?: string; user?: CurrentUser }
        | null;

      if (!res.ok) {
        toast.error(payload?.message || "Failed to update profile");
        return;
      }

      if (payload?.user) {
        setUser(payload.user);
      }
      toast.success(payload?.message || "Profile updated successfully");
      router.refresh();
    } finally {
      setUpdatingProfile(false);
    }
  };

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
          disabled={loggingOut}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60 transition-colors cursor-pointer"
        >
          Logout
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Profile Section</p>

        <div className="mt-3 flex items-start gap-3">
          <div className="h-11 w-11 shrink-0 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] inline-flex items-center justify-center text-sm font-bold">
            {(user?.name || "U").trim().charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-black break-words">{user?.name || "-"}</p>
            <p className="mt-0.5 text-sm text-gray-600 break-all">{user?.email || "-"}</p>

            {/* <span className="mt-2 inline-flex rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
              {user?.role || "-"}
            </span> */}
          </div>
        </div>
      </div>

      <form onSubmit={handleUpdateProfile} className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <h3 className="font-semibold">Edit My Profile</h3>
        <input
          type="text"
          placeholder="Full name"
          value={profileName}
          onChange={(event) => setProfileName(event.target.value)}
          className="input"
        />
        <input
          type="email"
          placeholder="Email address"
          value={profileEmail}
          onChange={(event) => setProfileEmail(event.target.value)}
          className="input"
        />
        <button
          type="submit"
          disabled={updatingProfile}
          className="bg-[var(--primary)] text-white px-4 py-2 rounded-lg disabled:opacity-60"
        >
          {updatingProfile ? "Saving..." : "Save Profile"}
        </button>
      </form>

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

      {/* {user?.role === "owner" ? (
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
            <div className="md:hidden divide-y divide-black/10">
              {users.map((entry) => (
                <div key={entry.id} className="p-4 space-y-2 text-sm">
                  <p className="font-semibold">{entry.name}</p>
                  <p>
                    <span className="text-gray-500">Email: </span>
                    {entry.email}
                  </p>
                  <p>
                    <span className="text-gray-500">Role: </span>
                    <span className="capitalize">{entry.role}</span>
                  </p>
                  <p className="text-gray-600">
                    <span className="text-gray-500">Last login: </span>
                    {entry.lastLoginAt
                      ? new Date(entry.lastLoginAt).toLocaleString()
                      : "Never"}
                  </p>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
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
          </div>
        </>
      ) : null} */}
    </section>
  );
}
