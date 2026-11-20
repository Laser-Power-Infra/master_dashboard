// Outside-office links (M15): Cloudflare Tunnel + Cloudflare Access on gmdalui.co.in.
// Every link is HTTPS and asks for an @laserpowerinfra.com email one-time code.
// Keep in sync with the tunnel routes in infrastructure/cloudflare/m15_setup.py.
import type { ServiceItem } from "@/types/service";

export const REMOTE_ACCESS_DOMAIN = "gmdalui.co.in";

const OFFICE_SERVER_IP = "192.168.1.190";

// LAN port on the office server -> public subdomain
const REMOTE_SUBDOMAIN_BY_PORT: Record<number, string> = {
  7777: "portal",
  3126: "tender-exec",
  4173: "enquiry",
  4555: "bom",
  4570: "gmd-quotation",
  5123: "inspection",
  6002: "email-dash",
  6004: "invoice",
  6010: "transport",
  6011: "ceebuild",
  6321: "sheets",
};

/** Public HTTPS link for a dashboard on the office server, or null if it has none. */
export function remoteUrlFor(service: Pick<ServiceItem, "ip" | "port">): string | null {
  if (service.ip?.trim() !== OFFICE_SERVER_IP) return null;
  const sub = REMOTE_SUBDOMAIN_BY_PORT[service.port];
  return sub ? `https://${sub}.${REMOTE_ACCESS_DOMAIN}` : null;
}
