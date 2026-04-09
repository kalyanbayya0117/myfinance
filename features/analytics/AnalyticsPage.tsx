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
} from "react-icons/hi";

type Metrics = {
  totalLent: number;
  totalActiveLent: number;
  totalCollected: number;
  totalInterestGenerated: number;
  activeLoans: number;
  closedLoans: number;
  totalLoans: number;
};

type MetricKey = keyof Metrics;

const metricOptions: {
  key: MetricKey;
  label: string;
  icon: React.ElementType;
  isCurrency: boolean;
  color: string;
  bgColor: string;
}[] = [
  { key: "totalLent", label: "Total Lent", icon: HiCash, isCurrency: true, color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200" },
  { key: "totalActiveLent", label: "Total Active Lent", icon: HiCash, isCurrency: true, color: "text-emerald-600", bgColor: "bg-emerald-50 border-emerald-200" },
  { key: "totalCollected", label: "Total Collected", icon: HiCash, isCurrency: true, color: "text-purple-600", bgColor: "bg-purple-50 border-purple-200" },
  { key: "totalInterestGenerated", label: "Total Interest Generated", icon: HiTrendingUp, isCurrency: true, color: "text-amber-600", bgColor: "bg-amber-50 border-amber-200" },
  { key: "activeLoans", label: "Active Loans", icon: HiClock, isCurrency: false, color: "text-cyan-600", bgColor: "bg-cyan-50 border-cyan-200" },
  { key: "closedLoans", label: "Closed Loans", icon: HiCheckCircle, isCurrency: false, color: "text-green-600", bgColor: "bg-green-50 border-green-200" },
  { key: "totalLoans", label: "Total Loans", icon: HiCollection, isCurrency: false, color: "text-indigo-600", bgColor: "bg-indigo-50 border-indigo-200" },
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
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("totalLent");
  const [period, setPeriod] = useState("lifetime");
  const [customMode, setCustomMode] = useState<"exact" | "range">("range");
  const [exactDate, setExactDate] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(null);

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
        setDateRange(null);
        return;
      }

      const data = await res.json();
      setMetrics(data.metrics);
      setDateRange({ from: data.from, to: data.to });
    } finally {
      setLoading(false);
    }
  }, [period, customMode, exactDate, fromDate, toDate]);

  useEffect(() => {
    if (period !== "custom") {
      fetchAnalytics();
    }
  }, [period, fetchAnalytics]);

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

          {/* Highlighted detail card */}
          {(() => {
            const opt = metricOptions.find((m) => m.key === selectedMetric)!;
            const val = metrics[opt.key] ?? 0;
            const display = opt.isCurrency ? formatCurrency(val) : val.toLocaleString();
            const Icon = opt.icon;

            return (
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
            );
          })()}
        </>
      )}
    </section>
  );
}
