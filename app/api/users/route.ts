import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { userSchema } from "@/lib/validations";
import { logActivity } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: me } = await supabase.from("users").select("role").eq("id", authUser.id).single();
  if (me?.role !== "admin") return NextResponse.json({ error: "Sèl Admin ka kreye itilizatè" }, { status: 403 });

  const body = await req.json();
  const parsed = userSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const admin = createAdminClient();
  const { data: newUser, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { name: parsed.data.name },
  });
  if (error || !newUser.user) return NextResponse.json({ error: error?.message }, { status: 400 });

  await admin.from("users").upsert({
    id: newUser.user.id,
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role,
  });

  await logActivity(supabase, authUser.id, `Utilisateur créé: ${parsed.data.email}`, "user", newUser.user.id);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: me } = await supabase.from("users").select("role").eq("id", authUser.id).single();
  if (me?.role !== "admin") return NextResponse.json({ error: "Sèl Admin ka efase itilizatè" }, { status: 403 });

  const { userId } = await req.json();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logActivity(supabase, authUser.id, `Utilisateur supprimé`, "user", userId);
  return NextResponse.json({ success: true });
}
