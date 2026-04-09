"use client";

import { useCallback, useEffect, useState } from "react";
import {
  HiCash,
  HiTrendingUp,
  HiCheckCircle,
  HiClock,
  HiCollection,
  HiCalendar,
  HiRefresh,
  HiLockClosed,
  HiEye,
  HiEyeOff,
} from "react-icons/hi";
import { toast } from "sonner";

type Metrics = {
  totalLent: number;
  totalActiveLent: number;
  totalCollected: number;
  totalInterestGenerated: number;
  activeLoans: number;
  closedLoans: number;
  totalLoans: number;
};

type LoanDetail = {
  _id: string;
  loanId: string;
  clientName: string;
  principal: number;
  interestGenerated: number;
  totalPaid: number;
  status: string;
  startDate: string;
};

type MetricKey = keyof Metrics;

type DetailAccessor = {
  valueKey: keyof LoanDetail;
  label: string;
  filterFn?: (l: LoanDetail) => boolean;
};

const metricOptions: {
  key: MetricKey;
  label: string;
  icon: React.ElementType;
  isCurrency: boolean;
  color: string;
  bgColor: string;
  detail?: DetailAccessor;
}[] = [
  { key: "totalLent", label: "Total Lent", icon: HiCash, isCurrency: true, color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200", detail: { valueKey: "principal", label: "Lent" } },
  { key: "totalActiveLent", label: "Total Active Lent", icon: HiCash, isCurrency: true, color: "text-emerald-600", bgColor: "bg-emerald-50 border-emerald-200", detail: { valueKey: "principal", label: "Lent", filterFn: (l) => l.status === "active" } },
  { key: "totalCollected", label: "Total Collected", icon: HiCash, isCurrency: true, color: "text-purple-600", bgColor: "bg-purple-50 border-purple-200" },
  { key: "totalInterestGenerated", label: "Total Interest Generated", icon: HiTrendingUp, isCurrency: true, color: "text-amber-600", bgColor: "bg-amber-50 border-amber-200", detail: { valueKey: "interestGenerated", label: "Interest Generated" } },
  { key: "activeLoans", label: "Active Loans", icon: HiClock, isCurrency: false, color: "text-cyan-600", bgColor: "bg-cyan-50 border-cyan-200", detail: { valueKey: "principal", label: "Principal", filterFn: (l) => l.status === "active" } },
  { key: "closedLoans", label: "Closed Loans", icon: HiCheckCircle, isCurrency: false, color: "text-green-600", bgColor: "bg-green-50 border-green-200", detail: { valueKey: "principal", label: "Principal", filterFn: (l) => l.status === "closed" } },
  { key: "totalLoans", label: "Total Loans", icon: HiCollection, isCurrency: false, color: "text-indigo-600", bgColor: "bg-indigo-50 border-indigo-200", detail: { valueKey: "principal", label: "Principal" } },
];

const periodOptions = [
  { value: "lifetime", label: "All", fullLabel: "Lifetime" },
  { value: "1w", label: "1W", fullLabel: "Last 1 Week" },
  { value: "1m", label: "1M", fullLabel: "Last 1 Month" },
  { value: "3m", label: "3M", fullLabel: "Last 3 Months" },
  { value: "1y", label: "1Y", fullLabel: "Last 1 Year" },
  { value: "custom", label: "Custom", fullLabel: "Custom" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, value || 0));
}

export default function AnalyticsPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("totalLent");
  const [period, setPeriod] = useState("lifetime");
  const [customMode, setCustomMode] = useState<"exact" | "range">("range");
  const [exactDate, setExactDate] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loanDetails, setLoanDetails] = useState<LoanDetail[]>([]);
  const [interestDetails, setInterestDetails] = useState<LoanDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(null);

  const handleUnlock = async () => {
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
      setUnlocked(true);
      setPassword("");
    } finally {
      setVerifying(false);
    }
  };

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("period", period);

      if (period === "custom") {
        if (customMode === "exact" && exactDate) {
          params.set("exact", exactDate);
        } else if (customMode === "range") {
          if (fromDate) params.set("from", fromDate);
          if (toDate) params.set("to", toDate);
        } else {
          setLoading(false);
          return;
        }
      }

      const res = await fetch(`/api/analytics?${params.toString()}`);
      if (!res.ok) {
        setMetrics(null);
        setLoanDetails([]);
        setInterestDetails([]);
        setDateRange(null);
        return;
      }

      const data = await res.json();
      setMetrics(data.metrics);
      setLoanDetails(data.loanDetails ?? []);
      setInterestDetails(data.interestDetails ?? []);
      setDateRange({ from: data.from, to: data.to });
    } finally {
      setLoading(false);
    }
  }, [period, customMode, exactDate, fromDate, toDate]);

  useEffect(() => {
    if (unlocked && period !== "custom") {
      fetchAnalytics();
    }
  }, [unlocked, period, fetchAnalytics]);

  const handleApplyCustom = () => {
    if (customMode === "exact" && !exactDate) return;
    if (customMode === "range" && !fromDate) return;
    fetchAnalytics();
  };

  const formatDateLabel = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const activePeriodLabel =
    periodOptions.find((p) => p.value === period)?.fullLabel ?? "";

  if (!unlocked) {
    return (
      <section className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <HiLockClosed className="text-3xl text-gray-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Analytics Locked</h2>
            <p className="text-sm text-gray-500 mt-1">Enter your password to view analytics data.</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUnlock();
            }}
            className="space-y-3"
          >
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoFocus
                className="input w-full pr-10"
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
            <button
              type="submit"
              disabled={verifying || !password.trim()}
              className="w-full bg-[var(--primary)] text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {verifying ? "Verifying…" : "Unlock"}
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          {dateRange && !loading && (
            <p className="mt-1 text-xs text-gray-500 inline-flex items-center gap-1">
              <HiCalendar className="text-sm" />
              {formatDateLabel(dateRange.from)} — {formatDateLabel(dateRange.to)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={fetchAnalytics}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
          title="Refresh"
        >
          <HiRefresh className={`text-base ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Time Period Tabs */}
      <div className="bg-white rounded-xl border border-black/10 shadow-sm">
        <div className="flex items-center gap-1 p-1.5">
          {periodOptions.map((opt) => {
            const active = period === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPeriod(opt.value)}
                className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold cursor-pointer transition ${
                  active
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="sm:hidden">{opt.label}</span>
                <span className="hidden sm:inline">{opt.fullLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Custom date picker */}
        {period === "custom" && (
          <div className="border-t border-black/10 p-4 space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCustomMode("range")}
                className={`rounded-full px-3 py-1 text-xs font-semibold cursor-pointer transition ${
                  customMode === "range"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Date Range
              </button>
              <button
                type="button"
                onClick={() => setCustomMode("exact")}
                className={`rounded-full px-3 py-1 text-xs font-semibold cursor-pointer transition ${
                  customMode === "exact"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Specific Date
              </button>
            </div>

            {customMode === "exact" ? (
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Date</label>
                  <input
                    type="date"
                    value={exactDate}
                    onChange={(e) => setExactDate(e.target.value)}
                    className="input"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCustom}
                  disabled={!exactDate}
                  className="bg-[var(--primary)] text-white px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            ) : (
              <div className="flex gap-3 items-end flex-wrap">
                <div className="flex-1 min-w-[130px] space-y-1">
                  <label className="text-xs font-semibold text-gray-500">From</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="input"
                  />
                </div>
                <div className="flex-1 min-w-[130px] space-y-1">
                  <label className="text-xs font-semibold text-gray-500">To</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="input"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCustom}
                  disabled={!fromDate}
                  className="bg-[var(--primary)] text-white px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-black/10 p-5 shadow-sm animate-pulse">
              <div className="h-3 w-20 bg-gray-200 rounded mb-3" />
              <div className="h-7 w-28 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : !metrics ? (
        <div className="bg-white rounded-xl border border-black/10 p-10 shadow-sm text-center">
          <p className="text-gray-400 text-sm">No data available for this period.</p>
        </div>
      ) : (
        <>
          {/* Stat cards grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metricOptions.map((opt) => {
              const val = metrics[opt.key] ?? 0;
              const display = opt.isCurrency ? formatCurrency(val) : val.toLocaleString();
              const isSelected = selectedMetric === opt.key;
              const Icon = opt.icon;

              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSelectedMetric(opt.key)}
                  className={`group relative rounded-xl border p-4 text-left cursor-pointer transition-all ${
                    isSelected
                      ? `${opt.bgColor} ring-2 ring-offset-1 ring-[var(--primary)]/30`
                      : "border-black/10 bg-white hover:border-black/20 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`inline-flex items-center justify-center h-8 w-8 rounded-lg ${isSelected ? opt.bgColor : "bg-gray-100"}`}>
                      <Icon className={`text-base ${isSelected ? opt.color : "text-gray-500"}`} />
                    </div>

                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
                    )}
                  </div>

                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
                    {opt.label}
                  </p>
                  <p className={`text-xl font-extrabold ${isSelected ? "text-black" : "text-gray-800"}`}>
                    {display}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Highlighted detail card + loan breakdown */}
          {(() => {
            const opt = metricOptions.find((m) => m.key === selectedMetric)!;
            const val = metrics[opt.key] ?? 0;
            const display = opt.isCurrency ? formatCurrency(val) : val.toLocaleString();
            const Icon = opt.icon;
            const detail = opt.detail;

            // Use interestDetails for interest metric, loanDetails for everything else
            const sourceData = selectedMetric === "totalInterestGenerated"
              ? interestDetails
              : loanDetails;

            const filteredLoans = detail?.filterFn
              ? sourceData.filter(detail.filterFn)
              : sourceData;

            const sortedLoans = [...filteredLoans].sort((a, b) => {
              const aVal = Number(a[detail?.valueKey ?? "principal"]) || 0;
              const bVal = Number(b[detail?.valueKey ?? "principal"]) || 0;
              return bVal - aVal;
            });

            return (
              <>
                <div className={`rounded-xl border ${opt.bgColor} p-6 shadow-sm`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`text-xl ${opt.color}`} />
                        <p className={`text-sm font-bold ${opt.color}`}>{opt.label}</p>
                      </div>
                      <p className="text-4xl font-extrabold text-black mt-2">{display}</p>
                      {dateRange && (
                        <p className="text-xs text-gray-500 mt-2">
                          {activePeriodLabel} &middot; {formatDateLabel(dateRange.from)} — {formatDateLabel(dateRange.to)}
                        </p>
                      )}
                    </div>

                    <div className={`h-14 w-14 rounded-2xl ${opt.bgColor} inline-flex items-center justify-center shrink-0`}>
                      <Icon className={`text-3xl ${opt.color} opacity-60`} />
                    </div>
                  </div>
                </div>

                {/* Loan-wise breakdown */}
                {detail && (
                  <div className="bg-white rounded-xl border border-black/10 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-black/10 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm">Loan-wise Breakdown</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{opt.label} — per loan details</p>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                        {sortedLoans.length} loans
                      </span>
                    </div>

                    {sortedLoans.length === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-400">
                        No loans found for this metric.
                      </div>
                    ) : (
                      <>
                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-black/10">
                          {sortedLoans.map((loan) => {
                            const amount = Number(loan[detail.valueKey]) || 0;
                            return (
                              <div key={loan._id} className="p-4 space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="font-semibold text-sm truncate">{loan.clientName || "Unknown"}</p>
                                    <p className="text-xs text-gray-500">{loan.loanId || "-"}</p>
                                  </div>
                                  <p className={`text-sm font-bold whitespace-nowrap ${opt.color}`}>
                                    {opt.isCurrency ? formatCurrency(amount) : amount.toLocaleString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <span>Principal: {formatCurrency(loan.principal)}</span>
                                  <span>•</span>
                                  <span className={`capitalize font-semibold ${loan.status === "active" ? "text-emerald-600" : "text-blue-600"}`}>
                                    {loan.status}
                                  </span>
                                  <span>•</span>
                                  <span>{loan.startDate}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                              <tr>
                                <th className="px-5 py-3 text-left font-semibold">Client</th>
                                <th className="px-5 py-3 text-left font-semibold">Loan ID</th>
                                <th className="px-5 py-3 text-left font-semibold">Principal</th>
                                <th className="px-5 py-3 text-left font-semibold">{detail.label}</th>
                                <th className="px-5 py-3 text-left font-semibold">Given Date</th>
                                <th className="px-5 py-3 text-left font-semibold">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortedLoans.map((loan) => {
                                const amount = Number(loan[detail.valueKey]) || 0;
                                return (
                                  <tr key={loan._id} className="border-t border-black/5 hover:bg-gray-50 transition">
                                    <td className="px-5 py-3 font-semibold">{loan.clientName || "Unknown"}</td>
                                    <td className="px-5 py-3 text-gray-600">{loan.loanId || "-"}</td>
                                    <td className="px-5 py-3">{formatCurrency(loan.principal)}</td>
                                    <td className={`px-5 py-3 font-bold ${opt.color}`}>
                                      {opt.isCurrency ? formatCurrency(amount) : amount.toLocaleString()}
                                    </td>
                                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{loan.startDate}</td>
                                    <td className="px-5 py-3">
                                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                                        loan.status === "active"
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                          : "bg-blue-50 text-blue-700 border border-blue-200"
                                      }`}>
                                        {loan.status}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </>
      )}
    </section>
  );
}
