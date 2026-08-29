"use client";

import React, { useState } from "react";
import type { ServiceItem } from "@/types/service";
import { deriveDisplayStatus, buildBaseUrl, buildPingUrl } from "@/types/service";
import { useServiceHealth } from "@/hooks/useServiceHealth";

interface QuickPeekModalProps {
  service: ServiceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (service: ServiceItem) => void;
  onRestart: (service: ServiceItem) => void;
}

type Viewport = "desktop" | "tablet" | "mobile";

const VIEWPORTS: Record<Viewport, { label: string; width: number }> = {
  desktop: { label: "Desktop", width: 1280 },
  tablet: { label: "Tablet", width: 768 },
  mobile: { label: "Mobile", width: 390 },
};

export default function QuickPeekModal({
  service,
  isOpen,
  onClose,
  onEdit,
  onRestart,
}: QuickPeekModalProps) {
  const [copied, setCopied] = useState(false);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [iframeKey, setIframeKey] = useState(0);

  const health = useServiceHealth(service, {
    persist: false,
  });

  if (!isOpen || !service) return null;

  const liveService: ServiceItem = {
    ...service,
    status: health.status,
    latency: health.latency,
  };
  const displayStatus = deriveDisplayStatus(liveService);
  const isOnline = displayStatus === "online";
  const isWarning = displayStatus === "warning";
  const isOffline = displayStatus === "offline";
  const isChecking = displayStatus === "checking";

  const baseUrl = buildBaseUrl(service);
  const pingUrl = buildPingUrl(service);
  const statusDotClass = isOnline
    ? "bg-[#4edea3] status-ring-pulse"
    : isWarning
    ? "bg-amber-400 status-ring-pulse-amber"
    : isOffline
    ? "bg-[#ffb4ab] status-ring-pulse-red"
    : "bg-[#849495]";

  const statusLabel = isOffline
    ? "OFFLINE"
    : isWarning
    ? "HIGH LATENCY"
    : isChecking
    ? "CHECKING"
    : "ONLINE";

  const copyUrl = () => {
    navigator.clipboard.writeText(baseUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sparkData = service.history.map((h) => h.latencyMs ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="modal-level-2 rounded-xl w-full max-w-5xl mx-auto flex flex-col z-10 relative overflow-hidden max-h-[94vh] border border-[#00f2fe]/30 shadow-[0_0_35px_rgba(0,242,254,0.18)]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#3a494b]/30 bg-[#121318]/70">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${statusDotClass}`} />
            <div>
              <h2 className="text-[18px] font-bold text-[#e3e1e9]">{service.name}</h2>
              <span className="font-mono text-[11px] text-[#b9cacb] uppercase">
                {service.category} {`//`} {service.ip}:{service.port} {`//`} {statusLabel}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Viewport toggle */}
            <div className="flex items-center gap-1 bg-[#1e1f25] rounded border border-[#3a494b]/40 p-0.5">
              {(Object.keys(VIEWPORTS) as Viewport[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setViewport(v)}
                  className={`px-2 py-1 rounded font-mono text-[10px] uppercase transition-colors cursor-pointer ${
                    viewport === v
                      ? "bg-[#00f2fe]/15 text-[#00dce6]"
                      : "text-[#849495] hover:text-[#b9cacb]"
                  }`}
                  title={`${VIEWPORTS[v].label} (${VIEWPORTS[v].width}px)`}
                >
                  {v === "desktop" ? "Desktop" : v === "tablet" ? "Tablet" : "Mobile"}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="text-[#b9cacb] hover:text-[#00dce6] transition-colors p-1"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-4">
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-[#1e1f25]/80 p-3 rounded border border-[#3a494b]/30 text-center">
                <span className="font-mono text-[9px] uppercase text-[#849495] block">Latency</span>
                <span
                  className={`font-mono text-[14px] font-bold ${
                    isWarning ? "text-amber-400" : isOffline ? "text-[#ffb4ab]" : "text-[#4edea3]"
                  }`}
                >
                  {liveService.latency !== null && liveService.latency !== undefined
                    ? `${liveService.latency}ms`
                    : "--"}
                </span>
              </div>
              <div className="bg-[#1e1f25]/80 p-3 rounded border border-[#3a494b]/30 text-center">
                <span className="font-mono text-[9px] uppercase text-[#849495] block">Port</span>
                <span className="font-mono text-[14px] font-bold text-[#00dce6]">
                  {service.port}
                </span>
              </div>
              <div className="bg-[#1e1f25]/80 p-3 rounded border border-[#3a494b]/30 text-center">
                <span className="font-mono text-[9px] uppercase text-[#849495] block">Protocol</span>
                <span className="font-mono text-[14px] font-bold text-[#e3e1e9]">
                  {service.protocol || "HTTP"}
                </span>
              </div>
              <div className="bg-[#1e1f25]/80 p-3 rounded border border-[#3a494b]/30 text-center">
                <span className="font-mono text-[9px] uppercase text-[#849495] block">History</span>
                <span className="font-mono text-[14px] font-bold text-[#e3e1e9]">
                  {service.history.length}
                </span>
              </div>
            </div>

            {/* Endpoint Details */}
            <div className="bento-card p-4 rounded-lg space-y-2">
              <span className="font-mono text-[10px] text-[#00dce6] uppercase tracking-wider font-bold block">
                Network & Routing
              </span>
              <div className="flex items-center justify-between bg-[#0d0e13] p-2 rounded border border-[#3a494b]/40 font-mono text-[12px]">
                <span className="text-[#b9cacb] truncate mr-2">{baseUrl}</span>
                <button
                  onClick={copyUrl}
                  className="text-[#00dce6] hover:text-[#6ff6ff] text-[11px] flex items-center gap-1 shrink-0"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copied ? "check" : "content_copy"}
                  </span>
                  <span>{copied ? "COPIED" : "COPY"}</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="font-mono text-[11px] text-[#849495]">
                  IP: <span className="text-[#e3e1e9]">{service.ip}</span>
                </span>
                <span className="font-mono text-[11px] text-[#849495]">
                  Ping: <span className="text-[#00dce6]">{pingUrl}</span>
                </span>
              </div>
            </div>

            {/* Latency Sparkline */}
            <div className="bento-card p-4 rounded-lg space-y-2">
              <span className="font-mono text-[10px] text-[#4edea3] uppercase tracking-wider font-bold block">
                Latency Sparkline
              </span>
              {sparkData.length > 0 ? (
                <div className="w-full h-16 flex items-end gap-1 px-1">
                  {sparkData.slice(-50).map((v, i) => {
                    const height = Math.min(100, Math.max(6, v / 10));
                    return (
                      <div
                        key={i}
                        style={{ height: `${height}%` }}
                        className={`flex-1 rounded-t-xs border-t ${
                          isOffline
                            ? "bg-gradient-to-t from-[#ffb4ab]/25 via-[#ffb4ab]/50 to-[#ffb4ab] border-[#ffb4ab]/70"
                            : isWarning
                            ? "bg-gradient-to-t from-amber-500/25 via-amber-500/50 to-amber-400 border-amber-400/70"
                            : "bg-gradient-to-t from-[#4edea3]/25 via-[#4edea3]/50 to-[#4edea3] border-[#4edea3]/70"
                        }`}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="w-full h-16 flex items-center justify-center font-mono text-[11px] text-[#849495]">
                  No history yet — checks are recorded every 30s.
                </div>
              )}
            </div>

            {/* iFrame Drawer */}
            <div className="bento-card p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] text-[#00dce6] uppercase tracking-wider font-bold block">
                  Live Preview ({VIEWPORTS[viewport].label} · {VIEWPORTS[viewport].width}px)
                </span>
                <button
                  onClick={() => setIframeKey((k) => k + 1)}
                  className="text-[#b9cacb] hover:text-[#00dce6] font-mono text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  Reload
                </button>
              </div>
              <div className="bg-[#0d0e13] rounded border border-[#3a494b]/40 overflow-auto p-3 flex justify-center">
                <div
                  style={{ width: VIEWPORTS[viewport].width }}
                  className="max-w-full transition-all duration-300"
                >
                  <iframe
                    key={iframeKey}
                    src={baseUrl}
                    title={`${service.name} preview`}
                    className="w-full bg-white rounded border border-[#3a494b]/30"
                    style={{ height: 420 }}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                </div>
              </div>
              {isOffline && (
                <p className="font-mono text-[11px] text-[#ffb4ab]">
                  Service is offline — preview may not load.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#3a494b]/30 bg-[#121318]/70">
          <button
            onClick={() => {
              onClose();
              onEdit(service);
            }}
            className="neon-button font-mono text-[11px] px-3 py-1.5 rounded flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">tune</span>
            <span>Configure</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onRestart(service)}
              className="text-[#b9cacb] hover:text-[#e3e1e9] font-mono text-[11px] px-3 py-1.5 flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">refresh</span>
              <span>Restart</span>
            </button>
            <button
              onClick={() => window.open(baseUrl, "_blank")}
              className="emerald-button font-mono text-[11px] px-4 py-1.5 rounded flex items-center gap-1.5 cursor-pointer font-bold"
            >
              <span>Launch</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}