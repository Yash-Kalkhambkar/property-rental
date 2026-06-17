import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  Home,
  DoorOpen,
  TrendingUp,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/PageHeader";
import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

export const Route = createFileRoute("/_app/")({
  head: () => ({ meta: [{ title: "Dashboard — RentEase" }] }),
  component: DashboardPage,
});

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Home;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4.5 w-4.5" />
          </div>
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Overview of your portfolio" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const s = data?.summary;
  const f = data?.financials;
  const a = data?.alerts;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your portfolio" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Building2} label="Properties" value={String(s?.total_properties ?? 0)} />
        <StatCard icon={Home} label="Total units" value={String(s?.total_units ?? 0)} />
        <StatCard
          icon={DoorOpen}
          label="Occupancy"
          value={`${s?.occupancy_rate ?? 0}%`}
          sub={`${s?.occupied_units ?? 0} occupied · ${s?.vacant_units ?? 0} vacant`}
        />
        <StatCard
          icon={TrendingUp}
          label="Collected this month"
          value={formatCurrency(f?.current_month_collected)}
          sub={`of ${formatCurrency(f?.current_month_expected)} expected`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Overdue payments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(a?.overdue_payments ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No overdue payments. 🎉</p>
            )}
            {a?.overdue_payments?.map((p) => (
              <div
                key={p.payment_id}
                className="flex items-center justify-between rounded-lg border bg-card p-3"
              >
                <div>
                  <p className="text-sm font-medium">{p.tenant_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.unit} · {p.overdue_days} days overdue
                  </p>
                </div>
                <span className="text-sm font-semibold text-destructive">
                  {formatCurrency(p.amount)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-warning-foreground" />
              Leases expiring soon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(a?.leases_expiring_soon ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No leases expiring soon.</p>
            )}
            {a?.leases_expiring_soon?.map((l) => (
              <Link
                key={l.lease_id}
                to="/leases/$id"
                params={{ id: l.lease_id }}
                className="flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-accent"
              >
                <div>
                  <p className="text-sm font-medium">{l.tenant_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {l.unit} · ends {formatDate(l.end_date)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-warning-foreground">
                  {l.days_remaining}d
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}