"use client";

import React, { useState, useMemo, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import ServiceCard from "@/components/ServiceCard";
import DeployModal from "@/components/DeployModal";
import QuickPeekModal from "@/components/QuickPeekModal";
import { useServices, type ServiceInput } from "@/hooks/useServices";
import { useServiceHealth } from "@/hooks/useServiceHealth";
import { deriveDisplayStatus, buildBaseUrl, type ServiceItem } from "@/types/service";

const CATEGORY_FILTERS = [
  "All",
  "Core Infrastructure",
  "Microservice",
  "Database",
  "Frontend",
  "API",
  "Workers",
  "Full Stack"
];

interface LiveServiceCardProps {
  service: ServiceItem;
  restartSignal: number;
  onQuickPeek: (s: ServiceItem) => void;
  onEdit: (s: ServiceItem) => void;
  onRestart: (s: ServiceItem) => void;
  onLaunch: (s: ServiceItem) => void;
}

function LiveServiceCard({
  service,
  restartSignal,
  onQuickPeek,
  onEdit,
  onRestart,
  onLaunch,
}: LiveServiceCardProps) {
  const health = useServiceHealth(service, { checkSignal: restartSignal });
  const liveService: ServiceItem = { ...service, status: health.status, latency: health.latency };
  return (
    <ServiceCard
      service={liveService}
      onQuickPeek={onQuickPeek}
      onEdit={onEdit}
      onRestart={onRestart}
      onLaunch={onLaunch}
    />
  );
}

export default function NexusPortDashboard() {
  const {
    services,
    loading,
    error,
    loadServices,
    createService,
    updateService,
    deleteService,
  } = useServices();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [restartSignals, setRestartSignals] = useState<Record<string, number>>({});

  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [quickPeekService, setQuickPeekService] = useState<ServiceItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const onlineCount = useMemo(
    () => services.filter((s) => deriveDisplayStatus(s) === "online").length,
    [services]
  );
  const totalCount = services.length;

  const avgLatency = useMemo(() => {
    const latencies = services
      .map((s) => s.latency)
      .filter((l): l is number => l !== null && l !== undefined);
    if (latencies.length === 0) return "--";
    return `${Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)}ms`;
  }, [services]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: services.length };
    for (const s of services) {
      counts[s.category] = (counts[s.category] || 0) + 1;
    }
    return counts;
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesCategory =
        selectedFilter === "All" || service.category === selectedFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        service.name.toLowerCase().includes(q) ||
        service.ip.toLowerCase().includes(q) ||
        service.port.toString().includes(q) ||
        service.category.toLowerCase().includes(q) ||
        service.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [services, selectedFilter, searchQuery]);

  const handleSaveService = async (input: ServiceInput) => {
    try {
      if (editingService) {
        await updateService(editingService.id, input);
        showToast(`Service "${input.name}" updated`);
      } else {
        await createService(input);
        showToast(`Service "${input.name}" deployed successfully`);
      }
      setIsDeployModalOpen(false);
      setEditingService(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to save service");
    }
  };

  const handleDeleteService = async (id: string) => {
    const target = services.find((s) => s.id === id);
    try {
      await deleteService(id);
      showToast(`Service "${target?.name || id}" removed`);
    } catch {
      showToast("Failed to remove service");
    }
  };

  const handleRestartService = (svc: ServiceItem) => {
    setRestartSignals((prev) => ({ ...prev, [svc.id]: (prev[svc.id] || 0) + 1 }));
    showToast(`Restart requested for "${svc.name}" — re-pinging health`);
  };

  const handleOpenDeploy = () => {
    setEditingService(null);
    setIsDeployModalOpen(true);
  };

  const handleEditService = (svc: ServiceItem) => {
    setEditingService(svc);
    setIsDeployModalOpen(true);
  };

  return (
    <div className="font-body-default min-h-screen flex flex-col bg-[#090a0f] text-[#e3e1e9]">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#121318] border border-[#00f2fe] text-[#e0fdff] px-4 py-3 rounded shadow-[0_0_20px_rgba(0,242,254,0.3)] flex items-center gap-2 font-mono text-[12px] animate-bounce">
          <span className="material-symbols-outlined text-[#4edea3] text-[18px]">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDeployModal={handleOpenDeploy}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 lg:ml-64 flex flex-col pt-16">
        <TopNav
          onlineCount={onlineCount}
          totalCount={totalCount}
          avgLatency={avgLatency}
          onOpenDeployModal={handleOpenDeploy}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <main className="flex-1 p-4 md:p-6 overflow-y-auto w-full max-w-container-max-width mx-auto">
          {loading ? (
            <div className="bento-card p-12 text-center flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-[#00dce6] text-[40px] animate-spin">
                progress_activity
              </span>
              <h3 className="text-[16px] font-bold text-[#e3e1e9]">Loading services...</h3>
            </div>
          ) : error ? (
            <div className="bento-card p-12 text-center flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-[#ffb4ab] text-[48px]">error</span>
              <h3 className="text-[18px] font-bold text-[#e3e1e9]">Failed to load services</h3>
              <p className="text-[#b9cacb] font-mono text-[12px]">{error}</p>
              <button
                onClick={loadServices}
                className="neon-button font-mono text-[12px] px-4 py-2 rounded mt-2 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && (
                <>
                  <div className="flex overflow-x-auto gap-2.5 pb-4 mb-6 hide-scrollbar border-b border-[#3a494b]/30">
                    {CATEGORY_FILTERS.map((filter) => {
                      const count = categoryCounts[filter] || 0;
                      const isSelected = selectedFilter === filter;
                      return (
                        <button
                          key={filter}
                          onClick={() => setSelectedFilter(filter)}
                          className={`px-4 py-1.5 rounded-full font-mono text-[12px] whitespace-nowrap transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#00f2fe]/15 border border-[#00f2fe] text-[#6ff6ff] shadow-[0_0_12px_rgba(0,242,254,0.2)] font-semibold"
                              : "bg-[#34343a]/40 border border-[#3a494b]/30 text-[#b9cacb] hover:text-[#e3e1e9] hover:border-[#849495]"
                          }`}
                        >
                          {filter} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {filteredServices.length === 0 ? (
                    <div className="bento-card p-12 text-center flex flex-col items-center justify-center gap-3">
                      <span className="material-symbols-outlined text-[#849495] text-[48px]">
                        search_off
                      </span>
                      <h3 className="text-[18px] font-bold text-[#e3e1e9]">
                        No services match your filter
                      </h3>
                      <p className="text-[#b9cacb] font-mono text-[12px]">
                        Try changing your category filter or search query.
                      </p>
                      <button
                        onClick={() => {
                          setSelectedFilter("All");
                          setSearchQuery("");
                        }}
                        className="neon-button font-mono text-[12px] px-4 py-2 rounded mt-2 cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-3 md:gap-4">
                      {filteredServices.map((service) => (
                        <LiveServiceCard
                          key={service.id}
                          service={service}
                          restartSignal={restartSignals[service.id] || 0}
                          onQuickPeek={(s) => setQuickPeekService(s)}
                          onEdit={handleEditService}
                          onRestart={handleRestartService}
                          onLaunch={(s) => window.open(buildBaseUrl(s), "_blank")}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === "deployments" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-[24px] font-bold text-[#e0fdff]">Deployments & Pipelines</h2>
                      <p className="font-mono text-[12px] text-[#b9cacb]">
                        Registered services and their health history
                      </p>
                    </div>
                    <button
                      onClick={handleOpenDeploy}
                      className="emerald-button font-mono text-[12px] px-4 py-2 rounded flex items-center gap-2 cursor-pointer font-bold"
                    >
                      <span className="material-symbols-outlined text-sm">rocket_launch</span>
                      <span>TRIGGER DEPLOY</span>
                    </button>
                  </div>

                  <div className="bento-card p-4 rounded-lg space-y-3">
                    <span className="font-mono text-[11px] text-[#00dce6] uppercase tracking-wider font-bold">
                      Registered Services
                    </span>
                    <div className="divide-y divide-[#3a494b]/30 font-mono text-[12px]">
                      {services.length === 0 ? (
                        <div className="py-3 text-[#849495]">No services registered yet.</div>
                      ) : (
                        services.map((svc) => {
                          const status = deriveDisplayStatus(svc);
                          return (
                            <div key={svc.id} className="py-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    status === "online"
                                      ? "bg-[#4edea3] status-ring-pulse"
                                      : status === "warning"
                                      ? "bg-amber-400"
                                      : status === "offline"
                                      ? "bg-[#ffb4ab]"
                                      : "bg-[#849495]"
                                  }`}
                                />
                                <div>
                                  <span className="text-[#e3e1e9] font-bold">{svc.name}</span>
                                  <span className="text-[#849495] text-[10px] block">
                                    {svc.ip}:{svc.port} • {svc.category}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] border ${
                                    status === "online"
                                      ? "bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/20"
                                      : status === "offline"
                                      ? "bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/20"
                                      : status === "warning"
                                      ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                                      : "bg-[#849495]/10 text-[#849495] border-[#849495]/20"
                                  }`}
                                >
                                  {status.toUpperCase()}
                                </span>
                                <button
                                  onClick={() => setQuickPeekService(svc)}
                                  className="text-[#b9cacb] hover:text-[#00dce6]"
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    visibility
                                  </span>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "infrastructure" && (
                <div className="space-y-4">
                  <h2 className="text-[24px] font-bold text-[#e0fdff]">Infrastructure Topology</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bento-card p-4 rounded-lg">
                      <span className="font-mono text-[10px] text-[#00dce6] uppercase block font-bold">
                        Registered Services
                      </span>
                      <span className="text-[28px] font-mono font-bold text-[#e3e1e9]">
                        {totalCount} Active
                      </span>
                      <p className="text-[12px] text-[#849495] mt-1">
                        {onlineCount} online, {totalCount - onlineCount} offline
                      </p>
                    </div>
                    <div className="bento-card p-4 rounded-lg">
                      <span className="font-mono text-[10px] text-[#4edea3] uppercase block font-bold">
                        Categories
                      </span>
                      <span className="text-[28px] font-mono font-bold text-[#e3e1e9]">
                        {Object.keys(categoryCounts).filter((k) => k !== "All").length}
                      </span>
                      <p className="text-[12px] text-[#849495] mt-1">
                        {Object.keys(categoryCounts)
                          .filter((k) => k !== "All")
                          .join(", ") || "None"}
                      </p>
                    </div>
                    <div className="bento-card p-4 rounded-lg">
                      <span className="font-mono text-[10px] text-[#ffb2b7] uppercase block font-bold">
                        Average Latency
                      </span>
                      <span className="text-[28px] font-mono font-bold text-[#e3e1e9]">
                        {avgLatency}
                      </span>
                      <p className="text-[12px] text-[#849495] mt-1">Live client-side ping</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-4">
                  <h2 className="text-[24px] font-bold text-[#e0fdff]">Security & Firewall Rules</h2>
                  <div className="bento-card p-6 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-[#e3e1e9]">LAN-Aware Health Checks</h3>
                        <p className="font-mono text-[12px] text-[#b9cacb]">
                          Status is computed by your browser pinging each registered endpoint.
                          No credentials or tokens are transmitted.
                        </p>
                      </div>
                      <span className="bg-[#4edea3]/10 text-[#4edea3] px-3 py-1 rounded text-[11px] font-mono border border-[#4edea3]/30">
                        CLIENT-SIDE
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-[#3a494b]/30">
                      <div>
                        <h3 className="font-bold text-[#e3e1e9]">Registered Endpoints</h3>
                        <p className="font-mono text-[12px] text-[#b9cacb]">
                          {totalCount} services configured for monitoring
                        </p>
                      </div>
                      <span className="bg-[#00f2fe]/10 text-[#00dce6] px-3 py-1 rounded text-[11px] font-mono border border-[#00f2fe]/30">
                        {onlineCount} ONLINE
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "analytics" && (
                <div className="space-y-4">
                  <h2 className="text-[24px] font-bold text-[#e0fdff]">Service Analytics & Metrics</h2>
                  <div className="bento-card p-6 rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[12px] text-[#00dce6] uppercase font-bold">
                        Services per Category
                      </span>
                      <span className="font-mono text-[14px] text-[#4edea3] font-bold">
                        {totalCount} total
                      </span>
                    </div>
                    <div className="w-full flex items-end gap-3 pt-4 h-36">
                      {CATEGORY_FILTERS.filter((c) => c !== "All").map((cat) => {
                        const count = categoryCounts[cat] || 0;
                        const pct = totalCount ? (count / totalCount) * 100 : 0;
                        return (
                          <div
                            key={cat}
                            className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
                            title={`${cat}: ${count}`}
                          >
                            <div
                              style={{ height: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                              className="w-full bg-gradient-to-t from-[#00f2fe]/10 via-[#00f2fe]/40 to-[#00f2fe] rounded-t-xs"
                            />
                            <span className="font-mono text-[9px] text-[#849495] truncate w-full text-center">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="space-y-4">
                  <h2 className="text-[24px] font-bold text-[#e0fdff]">NexusPort OS Settings</h2>
                  <div className="bento-card p-6 rounded-lg space-y-4 max-w-2xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-[#e3e1e9]">Live Health Polling</h3>
                        <p className="font-mono text-[12px] text-[#b9cacb]">
                          Each registered service is pinged from your browser every 30s.
                        </p>
                      </div>
                      <span className="font-mono text-[12px] text-[#00dce6]">30s</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-[#3a494b]/30">
                      <div>
                        <h3 className="font-bold text-[#e3e1e9]">History Persistence</h3>
                        <p className="font-mono text-[12px] text-[#b9cacb]">
                          Latency samples are stored per service for sparklines.
                        </p>
                      </div>
                      <span className="font-mono text-[12px] text-[#00dce6]">Last 50</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "docs" && (
                <div className="space-y-4">
                  <h2 className="text-[24px] font-bold text-[#e0fdff]">NexusPort OS Documentation</h2>
                  <div className="bento-card p-6 rounded-lg space-y-3 font-mono text-[12px] text-[#b9cacb] max-w-3xl">
                    <p className="text-[#e3e1e9] font-bold text-[14px]">Getting started</p>
                    <p>
                      Register a service with its name, IP, and port via the Deploy button. The
                      dashboard pings it from your browser and shows live online/offline badges and
                      latency sparklines.
                    </p>
                    <div className="p-3 bg-[#0d0e13] rounded border border-[#3a494b]/30">
                      <code>+ Deploy → name, IP (192.168.1.50), port (3000), category</code>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <DeployModal
        key={editingService?.id || "new-service"}
        isOpen={isDeployModalOpen}
        onClose={() => {
          setIsDeployModalOpen(false);
          setEditingService(null);
        }}
        onSave={handleSaveService}
        onDelete={async (id: string) => {
          await handleDeleteService(id);
          setIsDeployModalOpen(false);
          setEditingService(null);
        }}
        editingService={editingService}
      />

      <QuickPeekModal
        service={quickPeekService}
        isOpen={!!quickPeekService}
        onClose={() => setQuickPeekService(null)}
        onEdit={(svc) => {
          setQuickPeekService(null);
          handleEditService(svc);
        }}
        onRestart={(svc) => {
          handleRestartService(svc);
          if (quickPeekService) {
            setQuickPeekService({ ...quickPeekService, status: "checking", latency: null });
          }
        }}
      />
    </div>
  );
}