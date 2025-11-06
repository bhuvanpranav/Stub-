import { Badge } from "@/components/ui/badge";

export default function PilotBanner() {
  return (
    <section className="w-full">
      <div className="mx-auto max-w-6xl px-4">
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-primary/15 via-primary/10 to-transparent">
          <div className="flex flex-col items-start gap-3 p-4 md:flex-row md:items-center md:justify-between md:p-5">
            <div className="flex items-center gap-3">
              <Badge className="bg-primary text-primary-foreground shadow-sm">Coming Soon</Badge>
              <h4 className="text-base font-semibold tracking-tight">Demo ticket live now</h4>
            </div>
            <div className="text-xs text-muted-foreground">
              Pilot v1 · Limited features · Feedback welcome
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
