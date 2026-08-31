export type UserRole = "admin" | "modpass";
export type ChassisStatus = "available" | "in" | "out";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
}

export interface Chassis {
  id: string;
  chassis_number: string;
  type: string | null;
  status: ChassisStatus;
  date_in: string | null;
  date_out: string | null;
  notes: string | null;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  chassis_id: string | null;
  chassis_number: string;
  description: string | null;
  in_qty: number;
  out_qty: number;
  observation: string | null;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  invoice_date: string;
  total_in: number;
  total_out: number;
  balance: number;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
  client?: Client;
  invoice_items?: InvoiceItem[];
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  date: string;
  users?: { name: string };
}
