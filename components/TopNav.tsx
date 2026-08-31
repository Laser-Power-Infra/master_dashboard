"use client";

import React from "react";

interface TopNavProps {
  onlineCount: number;
  totalCount: number;
  avgLatency?: string;
  onOpenDeployModal: () => void;
  onOpenMobileMenu: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function TopNav({
  onlineCount,
  totalCount,
  avgLatency = "14ms",
  onOpenDeployModal,
  onOpenMobileMenu,
  searchQuery,
  setSearchQuery,
}: TopNavProps) {
  return (
    <header className="fixed top-0 lg:left-64 left-0 right-0 z-40 flex justify-between items-center px-4 md:px-6 h-16 bg-[#121318]/85 backdrop-blur-2xl text-primary border-b border-outline-variant/30 shadow-[0_4px_20px_rgba(0,242,254,0.06)]">
      <div className="flex items-center gap-4 md:gap-6">
        {/* Mobile Menu Trigger */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden text-on-surface-variant hover:text-primary-fixed transition-colors p-1"
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        {/* Brand / Status */}
        <div className="flex items-center gap-3 md:gap-4">
          

          <div className="flex items-center gap-2 bg-[#34343a]/50 rounded-full px-3 py-1 border border-outline-variant/30">
            <div className="w-2 h-2 rounded-full bg-[#4edea3] status-ring-pulse" />
            <span className="font-mono text-[12px] text-on-surface-variant">
              {onlineCount}/{totalCount} Online
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-[#34343a]/50 rounded-full px-3 py-1 border border-outline-variant/30">
            <span className="material-symbols-outlined text-[14px] text-[#00dce6]">sensors</span>
            <span className="font-mono text-[12px] text-on-surface-variant">{avgLatency}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {/* Quick Search */}
        <div className="relative hidden md:block w-48 lg:w-60">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-outline">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search service..."
            className="w-full bg-surface-container/70 border border-outline-variant/40 rounded-sm pl-8 pr-3 py-1 font-mono text-[12px] text-[#e3e1e9] placeholder-outline focus:outline-none focus:border-primary-container/60 focus:bg-surface-container"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-outline hover:text-[#e3e1e9]"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>

        {/* New Service Button */}
        <button
          onClick={onOpenDeployModal}
          className="neon-button font-mono text-[12px] py-1.5 px-3 rounded-xs flex items-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[14px]">add</span>
          <span className="hidden sm:inline">New Service</span>
        </button>

        {/* Action icons */}
        <div className="flex items-center gap-1 md:gap-2 text-on-surface-variant">
          {/* <button
            title="Cluster Telemetry"
            className="p-1.5 md:p-2 hover:bg-primary-container/10 hover:text-primary-fixed transition-colors rounded-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">sensors</span>
          </button>
          <button
            title="Memory Diagnostics"
            className="p-1.5 md:p-2 hover:bg-primary-container/10 hover:text-primary-fixed transition-colors rounded-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">memory</span>
          </button> */}
          <button
            title="User Profile & Security Keys"
            className="p-1.5 md:p-2 hover:bg-primary-container/10 hover:text-primary-fixed transition-colors rounded-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">account_circle</span>
          </button>
        </div>
      </div>
    </header>
  );
}
