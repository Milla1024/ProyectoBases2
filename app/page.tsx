'use client';
import { useState } from 'react';
import { Header } from "@/components/dashboard/header";
import { ConnectionStatusCard } from "@/components/dashboard/connection-status-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { TableSelection, type ActivityLog as ActivityLogType, type ErrorLog as ErrorLogType } from "@/components/dashboard/table-selection";
import { ErrorLog } from "@/components/dashboard/error-log";
import { ActivityLog } from "@/components/dashboard/activity-log";
import { replicationStats, errorLogs as initialErrorLogs, activityLogs as initialActivityLogs } from "@/library/data";
import { Clock, CheckCircle, DatabaseZap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PendingRecordsStatCard } from '@/components/dashboard/pending-records-stat-card';

export default function Home() {
    const [errorLogs, setErrorLogs] = useState<ErrorLogType[]>(initialErrorLogs);
    const [activityLogs, setActivityLogs] = useState<ActivityLogType[]>(initialActivityLogs);
    const [refreshPending, setRefreshPending] = useState(0);

    const handleNewLogs = (newActivities: ActivityLogType[], newErrors: ErrorLogType[]) => {
        setActivityLogs(prev => [...newActivities, ...prev]);
        setErrorLogs(prev => [...newErrors, ...prev]);
        setRefreshPending(count => count + 1);
    }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="container mx-auto flex-1 space-y-8 p-4 md:p-8">
        <Header />

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <ConnectionStatusCard database="Oracle" />
          <ConnectionStatusCard database="MySQL" />
          <StatCard
            title="Last Successful Sync"
            value={formatDistanceToNow(replicationStats.lastSync, {
              addSuffix: true,
            })}
            icon={<Clock className="h-6 w-6 text-muted-foreground" />}
            description="Across all tables"
          />
          <StatCard
            title="Success Percentage"
            value={`${replicationStats.successPercentage}%`}
            icon={<CheckCircle className="h-6 w-6 text-muted-foreground" />}
            description="Last 24 hours"
          />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TableSelection onReplicationComplete={handleNewLogs} />
          </div>
          <div className="flex flex-col gap-6">
             <PendingRecordsStatCard refreshKey={refreshPending} />
            <StatCard
              title="Replications Today"
              value="1,234"
              icon={<DatabaseZap className="h-6 w-6 text-muted-foreground" />}
              description="+20.1% from last day"
            />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ErrorLog logs={errorLogs} />
          </div>
          <ActivityLog logs={activityLogs} />
        </section>
      </main>
    </div>
  );
}
