"use client";

import React, { useState } from "react";
import type { ServiceItem } from "@/types/service";
import type { ServiceInput } from "@/hooks/useServices";

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: ServiceInput) => void;
  onDelete?: (id: string) => void;
  editingService?: ServiceItem | null;
}

const CATEGORIES = [
  "Core Infrastructure",
  "Microservice",
  "Database",
  "Frontend",
  "API",
  "Workers",
  "Full Stack"
];

const PROTOCOLS = ["HTTP", "HTTPS", "TCP"];

export default function DeployModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingService,
}: DeployModalProps) {
  const [name, setName] = useState(editingService?.name ?? "");
  const [category, setCategory] = useState(editingService?.category ?? "Microservice");
  const [ip, setIp] = useState(editingService?.ip ?? "");
  const [port, setPort] = useState<number | string>(editingService?.port ?? 8080);
  const [protocol, setProtocol] = useState(editingService?.protocol ?? "HTTP");
  const [healthcheck, setHealthcheck] = useState(editingService?.healthcheck ?? "/api/health");
  const [baseUrl, setBaseUrl] = useState(editingService?.baseUrl ?? "");
  const [description, setDescription] = useState(editingService?.description ?? "");
  const [tagsInput, setTagsInput] = useState(
    editingService?.tags ? editingService.tags.join(", ") : ""
  );
  const [isLarge, setIsLarge] = useState(!!editingService?.isLarge);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const parsedTags = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const cleanHealthcheck = healthcheck.trim() || "/api/health";
  const cleanBaseUrl = baseUrl.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ip.trim()) return;
    const numericPort = Number(port);
    if (!Number.isInteger(numericPort) || numericPort <= 0 || numericPort > 65535) return;

    setSaving(true);
    try {
      onSave({
        name: name.trim(),
        category,
        ip: ip.trim(),
        port: numericPort,
        protocol,
        healthcheck: cleanHealthcheck || null,
        baseUrl: cleanBaseUrl || null,
        description: description.trim() || null,
        tags: parsedTags.length > 0 ? parsedTags : [],
        isLarge,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Ambient Background Element */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00f2fe]/10 via-transparent to-transparent pointer-events-none" />

      {/* Modal Container */}
      <main className="modal-level-2 rounded-xl w-full max-w-2xl mx-auto flex flex-col z-10 relative overflow-hidden max-h-[92vh] border border-[#00f2fe]/30 shadow-[0_0_40px_rgba(0,242,254,0.2)]">
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-4 border-b border-[#3a494b]/30 bg-[#121318]/70">
          <div className="flex items-center gap-3">
            <span
              className="material-symbols-outlined text-[#00dce6]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {editingService ? "edit_note" : "add_box"}
            </span>
            <h1 className="text-[20px] font-bold text-[#e3e1e9]">
              {editingService ? "Edit Service Configuration" : "Deploy Service"}
            </h1>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-[#b9cacb] hover:text-[#00dce6] transition-colors p-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </header>

        {/* Form Content (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
            {/* Identity Section */}
            <section className="bento-card p-4 rounded-lg flex flex-col gap-3">
              <header className="flex justify-between items-start">
                <span className="font-mono text-[10px] text-[#00dce6] tracking-widest uppercase font-bold">
                  IDENTITY
                </span>
                <span className="material-symbols-outlined text-[#849495] text-sm">
                  badge
                </span>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[10px] uppercase text-[#b9cacb]">
                    Service Name *
                  </label>
                  <input
                    required
                    className="hud-input w-full font-mono text-[12px] px-0 py-2 placeholder-[#849495]/50"
                    placeholder="e.g. customer-portal"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[10px] uppercase text-[#b9cacb]">
                    Category
                  </label>
                  <select
                    className="hud-input w-full font-mono text-[12px] px-0 py-2 bg-[#121318] text-[#e3e1e9] cursor-pointer"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-[#1e1f25] text-[#e3e1e9]">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] uppercase text-[#b9cacb]">
                  Description
                </label>
                <input
                  className="hud-input w-full font-mono text-[12px] px-0 py-2 placeholder-[#849495]/50"
                  placeholder="Optional description of this service"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </section>

            {/* Network & Operations (Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Network Config */}
              <section className="bento-card col-span-1 md:col-span-6 p-4 rounded-lg flex flex-col gap-3">
                <header className="flex justify-between items-start">
                  <span className="font-mono text-[10px] text-[#00dce6] tracking-widest uppercase font-bold">
                    NETWORK
                  </span>
                  <span className="material-symbols-outlined text-[#849495] text-sm">
                    lan
                  </span>
                </header>
                <div className="flex flex-col gap-3 mt-1">
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] uppercase text-[#b9cacb]">
                      IP Address *
                    </label>
                    <input
                      required
                      className="hud-input w-full font-mono text-[12px] px-0 py-2 placeholder-[#849495]/50"
                      placeholder="192.168.1.50"
                      type="text"
                      value={ip}
                      onChange={(e) => setIp(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] uppercase text-[#b9cacb]">
                      Port *
                    </label>
                    <input
                      required
                      className="hud-input w-full font-mono text-[12px] px-0 py-2 placeholder-[#849495]/50"
                      placeholder="3000"
                      type="number"
                      min={1}
                      max={65535}
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] uppercase text-[#b9cacb]">
                      Protocol
                    </label>
                    <select
                      className="hud-input w-full font-mono text-[12px] px-0 py-2 bg-[#121318] text-[#e3e1e9] cursor-pointer"
                      value={protocol}
                      onChange={(e) => setProtocol(e.target.value)}
                    >
                      {PROTOCOLS.map((p) => (
                        <option key={p} value={p} className="bg-[#1e1f25] text-[#e3e1e9]">
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] uppercase text-[#b9cacb]">
                      Base URL (iframe / launch override)
                    </label>
                    <input
                      className="hud-input w-full font-mono text-[12px] px-0 py-2 placeholder-[#849495]/50"
                      placeholder="http://192.168.1.50:3000 (optional)"
                      type="text"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                    />
                  </div>
                </div>
              </section>

              {/* Operations Config */}
              <section className="bento-card col-span-1 md:col-span-6 p-4 rounded-lg flex flex-col gap-3">
                <header className="flex justify-between items-start">
                  <span className="font-mono text-[10px] text-[#00dce6] tracking-widest uppercase font-bold">
                    OPERATIONS
                  </span>
                  <span className="material-symbols-outlined text-[#849495] text-sm">
                    settings_suggest
                  </span>
                </header>
                <div className="flex flex-col gap-3 mt-1">
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] uppercase text-[#b9cacb]">
                      Healthcheck Endpoint *
                    </label>
                    <input
                      required
                      className="hud-input w-full font-mono text-[12px] px-0 py-2 placeholder-[#849495]/50"
                      placeholder="/api/health"
                      type="text"
                      value={healthcheck}
                      onChange={(e) => setHealthcheck(e.target.value)}
                    />
                    <p className="font-mono text-[10px] text-[#849495]">
                      Dashboard fetches GET {protocol === "HTTPS" ? "https" : "http"}
                      {"://"}
                      {ip || "192.168.1.x"}:{port || "8080"}
                      {cleanHealthcheck} every 30s.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] uppercase text-[#b9cacb]">
                      Tags (comma separated)
                    </label>
                    <input
                      className="hud-input w-full font-mono text-[12px] px-0 py-2 placeholder-[#849495]/50"
                      placeholder="prod, backend, critical"
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                    />
                    {parsedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {parsedTags.map((tag, i) => (
                          <span
                            key={i}
                            className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-[#00f2fe]/10 text-[#00dce6] border border-[#00f2fe]/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* Layout Preference */}
            <section className="bento-card p-4 rounded-lg flex flex-col gap-3">
              <header className="flex justify-between items-start">
                <span className="font-mono text-[10px] text-[#00dce6] tracking-widest uppercase font-bold">
                  DISPLAY
                </span>
                <span className="material-symbols-outlined text-[#849495] text-sm">
                  dashboard_customize
                </span>
              </header>
              <div className="flex flex-col gap-2 mt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isLarge}
                    onChange={(e) => setIsLarge(e.target.checked)}
                    className="rounded bg-[#1e1f25] border-[#3a494b] text-[#00f2fe] focus:ring-0"
                  />
                  <span className="font-mono text-[12px] text-[#e3e1e9]">
                    Hero / 6-Column Card
                  </span>
                </label>
              </div>
            </section>

            {/* Live Preview Section */}
            <section className="p-4 rounded-lg bg-[#0d0e13]/90 border border-[#3a494b]/40 flex flex-col gap-2">
              <label className="font-mono text-[10px] text-[#b9cacb] uppercase tracking-wider font-bold">
                LIVE ENDPOINT PREVIEW
              </label>
              <div className="flex items-center gap-3 font-mono text-[13px]">
                <span
                  className="material-symbols-outlined text-[#4edea3] text-sm shrink-0"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  public
                </span>
                <span className="text-[#e3e1e9] break-all">
                  {protocol === "HTTPS" ? "https://" : "http://"}
                  <span className="text-[#00dce6] font-bold">
                    {ip || "192.168.1.x"}
                  </span>
                  :
                  <span className="text-[#ffb2b7]">{port || "8080"}</span>
                  <span className="text-[#b9cacb]">{cleanHealthcheck}</span>
                </span>
              </div>
            </section>
          </div>

          {/* Footer Actions */}
          <footer className="flex items-center justify-between px-6 py-4 border-t border-[#3a494b]/30 bg-[#121318]/80">
            <div>
              {editingService && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete service "${editingService.name}"?`)) {
                      onDelete(editingService.id);
                    }
                  }}
                  className="font-mono text-[11px] text-[#ffb4ab] hover:text-red-400 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  <span>DELETE</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="font-mono text-[11px] px-4 py-2 text-[#b9cacb] hover:text-[#e3e1e9] transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={saving}
                className="emerald-button font-mono text-[11px] px-6 py-2 rounded flex items-center gap-2 cursor-pointer font-bold uppercase tracking-wider disabled:opacity-60"
              >
                <span
                  className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  save
                </span>
                <span>{editingService ? "SAVE CHANGES" : "DEPLOY SERVICE"}</span>
              </button>
            </div>
          </footer>
        </form>
      </main>
    </div>
  );
}