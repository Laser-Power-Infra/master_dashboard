"use client";

import React from "react";
import { ServiceItem, deriveDisplayStatus, buildBaseUrl, getCompany, displayAddress } from "@/types/service";

interface ServiceCardProps {
  service: ServiceItem;
  onQuickPeek: (service: ServiceItem) => void;
  onEdit: (service: ServiceItem) => void;
  onRestart?: (service: ServiceItem) => void;
  onLaunch?: (service: ServiceItem) => void;
}

export default function ServiceCard({
  service,
  onQuickPeek,
  onEdit,
  onRestart,
  onLaunch,
}: ServiceCardProps) {
  const displayStatus = deriveDisplayStatus(service);
  const isOnline = displayStatus === "online";
  const isWarning = displayStatus === "warning";
  const isOffline = displayStatus === "offline";
  const isChecking = displayStatus === "checking";

  const statusDotClass = isOnline
    ? "bg-[#4edea3] status-ring-pulse"
    : isWarning
    ? "bg-amber-400 status-ring-pulse-amber"
    : isOffline
    ? "bg-error status-ring-pulse-red"
    : "bg-outline";

  const statusLabel = isOffline
    ? "OFFLINE"
    : isWarning
    ? "HIGH LATENCY"
    : isChecking
    ? "CHECKING"
    : "ONLINE";

  const latencyLabel =
    service.latency !== null && service.latency !== undefined
      ? `${service.latency}ms`
      : "--";

  const sparkData = service.history.map((h) => h.latencyMs ?? 0);

  // Large Hero Card
  if (service.isLarge) {
    return (
      <div className="col-span-2 md:col-span-6 lg:col-span-6 bento-card p-4 md:p-5 flex flex-col group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-primary-container/5 rounded-bl-full blur-2xl pointer-events-none" />

        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${statusDotClass}`} />
            <h3 className="text-[20px] font-bold text-[#e3e1e9] tracking-tight group-hover:text-primary-fixed transition-colors">
              {service.name}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(service)}
              title="Edit Service Config"
              className="text-outline hover:text-[#00dce6] p-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
            </button>
            <span className="material-symbols-outlined text-outline-variant group-hover:text-[#00dce6] transition-colors">
              dns
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="bg-primary/10 text-[#00dce6] px-2 py-0.5 rounded-xs font-mono text-[12px] border border-[#00dce6]/20">
            {displayAddress(service)}
          </span>
          <span className="bg-[#4edea3]/10 text-[#4edea3] px-2 py-0.5 rounded-xs font-mono text-[12px] border border-[#4edea3]/20">
            {service.protocol || "HTTP"}
          </span>
          <span className="bg-[#34343a]/60 text-on-surface-variant px-2 py-0.5 rounded-xs font-mono text-[10px] uppercase border border-outline-variant/30">
            {getCompany(service) ?? "—"}
          </span>
        </div>

        <div className="flex-1 min-h-[54px] flex items-end mb-4 opacity-80 group-hover:opacity-100 transition-opacity">
          {sparkData.length > 0 ? (
            <div className="w-full h-12 flex items-end gap-1 px-1">
              {sparkData.slice(-30).map((v, i) => {
                const height = Math.min(100, Math.max(6, v / 10));
                return (
                  <div
                    key={i}
                    style={{ height: `${height}%` }}
                    className={`flex-1 rounded-t-xs border-t transition-all duration-300 ${
                      isOffline
                        ? "bg-linear-to-t from-error/25 via-error/50 to-error border-error/70"
                        : isWarning
                        ? "bg-linear-to-t from-amber-500/25 via-amber-500/50 to-amber-400 border-amber-400/70"
                        : "bg-linear-to-t from-[#4edea3]/25 via-[#4edea3]/50 to-[#4edea3] border-[#4edea3]/70"
                    }`}
                  />
                );
              })}
            </div>
          ) : (
            <div className="w-full h-12 flex items-center justify-center font-mono text-[11px] text-outline">
              No history yet
            </div>
          )}
        </div>

        <div className="flex justify-between items-center border-t border-outline-variant/30 pt-3 mt-auto">
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => onQuickPeek(service)}
              className="text-on-surface-variant hover:text-[#00dce6] transition-colors flex items-center gap-1 font-mono text-[12px] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span>Quick Peek</span>
            </button>
            {/* <button
              onClick={() => onQuickPeek(service)}
              title="Show QR / Network Info"
              className="text-on-surface-variant hover:text-[#00dce6] transition-colors flex items-center gap-1 font-mono text-[12px] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">qr_code</span>
            </button> */}
          </div>

          <button
            onClick={() =>
              onLaunch ? onLaunch(service) : window.open(buildBaseUrl(service), "_blank")
            }
            className="text-[#00dce6] font-mono text-[12px] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Launch</span>
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </button>
        </div>
      </div>
    );
  }

  // Offline / Error Red Card
  if (isOffline) {
    return (
      <div className="col-span-2 md:col-span-3 lg:col-span-3 bento-card p-4 flex flex-col group border-error/30 bg-error/5 hover:border-error/60">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className={`w-2 h-2 rounded-full ${statusDotClass} shrink-0`} />
            <h3 className="text-[14px] font-bold text-[#e3e1e9] truncate" title={service.name}>
              {service.name}
            </h3>
          </div>
          <button
            onClick={() => onEdit(service)}
            title="Edit"
            className="text-outline hover:text-error p-0.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
          </button>
        </div>

        <div className="mb-3">
          <span className="bg-error/15 text-error px-2 py-0.5 rounded-xs font-mono text-[10px] border border-error/30 tracking-wider">
            {statusLabel}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="bg-[#34343a] text-outline px-2 py-0.5 rounded-xs font-mono text-[12px] border border-outline-variant/30 w-max">
            {displayAddress(service)}
          </span>
          <span className="text-outline font-mono text-[10px] uppercase">
            {getCompany(service) ?? "—"}
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-end mt-auto">
          <div className="flex justify-between items-center border-t border-error/25 pt-3">
            <button
              onClick={() => onQuickPeek(service)}
              className="text-on-surface-variant hover:text-error text-[12px] font-mono flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span>Diagnostics</span>
            </button>
            <button
              onClick={() => (onRestart ? onRestart(service) : null)}
              className="text-error font-mono text-[12px] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Restart</span>
              <span className="material-symbols-outlined text-[14px]">refresh</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Regular Online / Warning Bento Card
  return (
    <div
      className={`col-span-2 md:col-span-3 lg:col-span-3 bento-card p-4 flex flex-col group ${
        isWarning
          ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60"
          : "hover:border-primary-container/40"
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className={`w-2 h-2 rounded-full ${statusDotClass} shrink-0`} />
          <h3 className="text-[14px] font-bold text-[#e3e1e9] truncate" title={service.name}>
            {service.name}
          </h3>
        </div>
        <button
          onClick={() => onEdit(service)}
          title="Edit"
          className="text-outline hover:text-[#00dce6] p-0.5 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">tune</span>
        </button>
      </div>

      {isWarning && (
        <div className="mb-2">
          <span className="bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-xs font-mono text-[10px] border border-amber-500/30 tracking-wider">
            {statusLabel}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <span className="bg-primary/10 text-[#00dce6] px-2 py-0.5 rounded-xs font-mono text-[12px] border border-[#00dce6]/20 w-max">
          {displayAddress(service)}
        </span>
        <span className="text-outline font-mono text-[10px] uppercase truncate">
          {getCompany(service) ?? "—"}
        </span>
      </div>

      {service.tags && service.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {service.tags.slice(0, 2).map((t, idx) => (
            <span
              key={idx}
              className="font-mono text-[10px] px-1.5 py-0.2 bg-[#34343a]/40 text-on-surface-variant rounded-xs"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="flex-1 flex flex-col justify-end mt-auto">
        <div className="flex justify-between items-center border-t border-outline-variant/30 pt-3">
          <span
            className={`font-mono text-[11px] font-bold ${
              isWarning ? "text-amber-400" : "text-[#4edea3]"
            }`}
          >
            {latencyLabel}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onQuickPeek(service)}
              className="text-on-surface-variant hover:text-[#00dce6] transition-colors p-1"
              title="Quick Peek"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
            </button>
            {/* <button
              onClick={() => onQuickPeek(service)}
              className="text-on-surface-variant hover:text-[#00dce6] transition-colors p-1"
              title="QR / Endpoint"
            >
              <span className="material-symbols-outlined text-[16px]">qr_code</span>
            </button> */}
          </div>
          <button
            onClick={() =>
              onLaunch ? onLaunch(service) : window.open(buildBaseUrl(service), "_blank")
            }
            className="text-on-surface-variant hover:text-[#00dce6] transition-colors p-1 flex items-center gap-1 font-mono text-[11px]"
            title="Launch in browser"
          >
            <span>Open</span>
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </button>
        </div>
      </div>
    </div>
  );
}