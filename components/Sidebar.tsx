"use client";

import React from "react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenDeployModal: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: "grid_view" },
  { id: "deployments", label: "Deployments", icon: "rocket_launch" },
  { id: "infrastructure", label: "Infrastructure", icon: "dns" },
  { id: "security", label: "Security", icon: "security" },
  { id: "analytics", label: "Analytics", icon: "query_stats" },
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  onOpenDeployModal,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* SideNavBar */}
      <nav
        className={`fixed left-0 top-0 h-full w-64 bg-[#0d0e13]/90 backdrop-blur-3xl text-[#e0fdff] border-r border-[#3a494b]/30 z-50 flex flex-col py-6 transition-transform duration-300 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand / Logo */}
        <div className="px-3 mb-8 flex items-center justify-between">
          <div className="text-[20px] font-bold text-[#e0fdff] flex items-center gap-3">
            <div className="w-8 h-8 rounded-[0.125rem] bg-gradient-to-br from-[#00f2fe] via-[#00696f] to-[#121318] p-[1px] shadow-[0_0_12px_rgba(0,242,254,0.3)] flex items-center justify-center">
              <div className="w-full h-full bg-[#121318] rounded-[0.125rem] flex items-center justify-center">
                <span className="font-mono text-[#00f2fe] font-black text-sm tracking-wider">M</span>
              </div>
            </div>
            <div>
              <span className="tracking-wider">MASTER</span>
              {/* <span className="text-[#b9cacb] font-mono text-[10px] tracking-widest uppercase">v1.0.0</span> */}
            </div>
          </div>

          {/* Close on mobile */}
          {isMobileOpen && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden text-[#b9cacb] hover:text-[#6ff6ff] p-1"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>

        {/* Deploy Button */}
        {/* <button
          onClick={() => {
            onOpenDeployModal();
            if (onCloseMobile) onCloseMobile();
          }}
          className="mx-4 mb-6 neon-button font-mono text-[12px] py-2 px-4 rounded-[0.125rem] flex items-center justify-center gap-2 cursor-pointer group"
        >
          <span className="material-symbols-outlined text-[16px] group-hover:rotate-90 transition-transform">add</span>
          <span>+ Deploy</span>
        </button> */}

        {/* Navigation Tabs */}
        <div className="flex-1 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`flex items-center gap-3 px-4 py-3 text-left transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#00f2fe]/10 text-[#00f2fe] border-l-2 border-[#00f2fe] shadow-[inset_0_0_15px_rgba(0,242,254,0.1)] font-medium"
                    : "text-[#b9cacb] hover:bg-[#34343a]/40 hover:text-[#e3e1e9]"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                <span className="font-mono text-[12px] uppercase tracking-wider">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto flex flex-col gap-1 border-t border-[#3a494b]/30 pt-4">
          <button
            onClick={() => {
              setActiveTab("settings");
              if (onCloseMobile) onCloseMobile();
            }}
            className={`flex items-center gap-3 px-4 py-3 text-left transition-all cursor-pointer ${
              activeTab === "settings"
                ? "bg-[#00f2fe]/10 text-[#00f2fe] border-l-2 border-[#00f2fe]"
                : "text-[#b9cacb] hover:bg-[#34343a]/40 hover:text-[#e3e1e9]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
            <span className="font-mono text-[12px] uppercase tracking-wider">Settings</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("docs");
              if (onCloseMobile) onCloseMobile();
            }}
            className={`flex items-center gap-3 px-4 py-3 text-left transition-all cursor-pointer ${
              activeTab === "docs"
                ? "bg-[#00f2fe]/10 text-[#00f2fe] border-l-2 border-[#00f2fe]"
                : "text-[#b9cacb] hover:bg-[#34343a]/40 hover:text-[#e3e1e9]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">menu_book</span>
            <span className="font-mono text-[12px] uppercase tracking-wider">Docs</span>
          </button>
        </div>
      </nav>
    </>
  );
}
