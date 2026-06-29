import { normalizeDomain } from "@/lib/site";

export type ManagedDomain = {
  id?: string;
  dominio: string;
  provider: string;
  status: "ready" | "pending" | "inactive";
  notes: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ManagedDomainRow = {
  id?: string;
  dominio: string;
  provider: string | null;
  status: "ready" | "pending" | "inactive" | null;
  notes: string | null;
  active: boolean | null;
  created_at?: string;
  updated_at?: string;
};

export function normalizeManagedDomain(
  input: Partial<ManagedDomain>
): ManagedDomain {
  return {
    id: input.id,
    dominio: normalizeDomain(input.dominio || ""),
    provider: (input.provider || "vercel").trim().toLowerCase(),
    status: input.status || "ready",
    notes: (input.notes || "").trim(),
    active: input.active ?? true,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt
  };
}

export function domainToRow(domain: ManagedDomain): ManagedDomainRow {
  return {
    id: domain.id,
    dominio: domain.dominio,
    provider: domain.provider || "vercel",
    status: domain.status || "ready",
    notes: domain.notes || null,
    active: domain.active,
    created_at: domain.createdAt,
    updated_at: domain.updatedAt
  };
}

export function rowToDomain(row: ManagedDomainRow): ManagedDomain {
  return {
    id: row.id,
    dominio: row.dominio,
    provider: row.provider || "vercel",
    status: row.status || "ready",
    notes: row.notes || "",
    active: row.active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
