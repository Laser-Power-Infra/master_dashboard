import {
  Category,
  Protocol,
  CheckStatus,
  type Service as DbService,
  type HealthCheck as DbHealthCheck,
} from "@/lib/generated/prisma/client";

export const CATEGORY_LABELS: Record<Category, string> = {
  [Category.CORE_INFRASTRUCTURE]: "Core Infrastructure",
  [Category.MICROSERVICE]: "Microservice",
  [Category.DATABASE]: "Database",
  [Category.FRONTEND]: "Frontend",
  [Category.API]: "API",
  [Category.WORKERS]: "Workers",
  [Category.FULLSTACK]: "Full Stack",
};

export const CATEGORY_ENUM: Record<string, Category> = {
  "Core Infrastructure": Category.CORE_INFRASTRUCTURE,
  Microservice: Category.MICROSERVICE,
  Database: Category.DATABASE,
  Frontend: Category.FRONTEND,
  API: Category.API,
  Workers: Category.WORKERS,
  "Full Stack": Category.FULLSTACK,
};

export const PROTOCOL_LABELS: Record<Protocol, string> = {
  [Protocol.HTTP]: "HTTP",
  [Protocol.HTTPS]: "HTTPS",
  [Protocol.TCP]: "TCP",
};

export const PROTOCOL_ENUM: Record<string, Protocol> = {
  HTTP: Protocol.HTTP,
  HTTPS: Protocol.HTTPS,
  TCP: Protocol.TCP,
};

export interface ServiceView {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  ip: string;
  port: number;
  protocol: string;
  healthcheck?: string | null;
  baseUrl?: string | null;
  tags: string[];
  isLarge: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HealthView {
  id: string;
  status: string;
  latencyMs: number | null;
  checkedAt: string;
}

type ServiceWithTags = DbService & { tags: { id: string; name: string }[] };

export function toServiceView(service: ServiceWithTags): ServiceView {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    category: CATEGORY_LABELS[service.category],
    ip: service.ip,
    port: service.port,
    protocol: PROTOCOL_LABELS[service.protocol],
    healthcheck: (service.healthcheck || "/api/health").replace(/\/null/g, "") || "/api/health",
    baseUrl: service.baseUrl ? service.baseUrl.replace(/\/null/g, "") : null,
    tags: service.tags.map((t) => t.name),
    isLarge: service.isLarge,
    enabled: service.enabled,
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
  };
}

export function toHealthView(check: DbHealthCheck): HealthView {
  return {
    id: check.id,
    status: check.status === CheckStatus.ONLINE ? "ONLINE" : "OFFLINE",
    latencyMs: check.latencyMs,
    checkedAt: check.checkedAt.toISOString(),
  };
}