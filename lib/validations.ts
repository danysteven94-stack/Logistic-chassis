import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(2, "Non kliyan a twò kout"),
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email envalid").optional().or(z.literal("")),
  address: z.string().optional(),
});
export type ClientFormValues = z.infer<typeof clientSchema>;

export const chassisSchema = z.object({
  chassis_number: z.string().min(1, "Numéro chassis obligatwa"),
  type: z.string().optional(),
  status: z.enum(["available", "in", "out"]).default("available"),
  date_in: z.string().optional(),
  date_out: z.string().optional(),
  notes: z.string().optional(),
});
export type ChassisFormValues = z.infer<typeof chassisSchema>;

export const invoiceItemSchema = z.object({
  chassis_id: z.string().optional(),
  chassis_number: z.string().min(1, "Chassis obligatwa"),
  description: z.string().optional(),
  in_qty: z.coerce.number().int().min(0).default(0),
  out_qty: z.coerce.number().int().min(0).default(0),
  observation: z.string().optional(),
});

export const invoiceSchema = z.object({
  client_id: z.string().min(1, "Kliyan obligatwa"),
  invoice_date: z.string().min(1, "Dat obligatwa"),
  items: z.array(invoiceItemSchema).min(1, "Ajoute omwen yon liy chassis"),
});
export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6, "Modpass dwe genyen omwen 6 karaktè"),
  role: z.enum(["admin", "modpass"]),
});
export type UserFormValues = z.infer<typeof userSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Modpass obligatwa"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;
