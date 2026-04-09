"use client";

import { useState } from "react";
import { HiEye, HiEyeOff, HiX } from "react-icons/hi";
import { toast } from "sonner";

interface Props {
  label: string;
  value: string | number;
}

export default function ProtectedStatCard({ label, value }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEyeClick = () => {
    if (revealed) {
      setRevealed(false);
      return;
    }
    setPassword("");
    setShowModal(true);
  };

  const handleVerify = async () => {
    if (!password.trim()) return;

    setVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.message || "Incorrect password");
        return;
      }

      setRevealed(true);
      setShowModal(false);
      setPassword("");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{label}</p>
          <button
            type="button"
            onClick={handleEyeClick}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
            aria-label={revealed ? "Hide amount" : "Show amount"}
          >
            {revealed ? (
              <HiEyeOff className="text-lg" />
            ) : (
              <HiEye className="text-lg" />
            )}
          </button>
        </div>
        <h3 className="text-2xl font-extrabold mt-2">
          {revealed ? value : "••••••"}
        </h3>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Enter Password</h3>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setPassword("");
                }}
                disabled={verifying}
                className="p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
                aria-label="Close"
              >
                <HiX className="text-lg" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Enter your account password to view the amount.
            </p>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleVerify();
                }}
                placeholder="Password"
                className="input w-full pr-10"
                autoFocus
                disabled={verifying}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <HiEyeOff className="text-lg" /> : <HiEye className="text-lg" />}
              </button>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setPassword("");
                }}
                disabled={verifying}
                className="w-1/2 border border-black/10 text-gray-700 py-2 rounded-lg cursor-pointer disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerify}
                disabled={verifying || !password.trim()}
                className="w-1/2 bg-[var(--primary)] text-white py-2 rounded-lg cursor-pointer disabled:opacity-60"
              >
                {verifying ? "Verifying..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
