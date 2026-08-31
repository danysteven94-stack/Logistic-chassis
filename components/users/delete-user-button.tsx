"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteUserButton({ userId }: { userId: string }) {
  const router = useRouter();
  const handleDelete = async () => {
    if (!confirm("Ou sèten ou vle efase itilizatè sa a?")) return;
    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) return toast.error("Erè pandan efase a");
    toast.success("Itilizatè efase");
    router.refresh();
  };
  return (
    <Button size="icon" variant="ghost" onClick={handleDelete}>
      <Trash2 className="h-4 w-4 text-red-600" />
    </Button>
  );
}
