import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  title, value, icon: Icon, accent,
}: { title: string; value: string | number; icon: LucideIcon; accent?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold text-deka-navy">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-full ${accent ?? "bg-deka-navy/10"}`}>
          <Icon className="h-5 w-5 text-deka-navy" />
        </div>
      </CardContent>
    </Card>
  );
}
