'use client';
import { useState, useEffect } from 'react';
import { Header } from "@/components/dashboard/header";
import { ConnectionStatusCard } from "@/components/dashboard/connection-status-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { TableSelection, type ActivityLog as ActivityLogType, type ErrorLog as ErrorLogType } from "@/components/dashboard/table-selection";
import { ErrorLog } from "@/components/dashboard/error-log";
import { ActivityLog } from "@/components/dashboard/activity-log";
import { replicationStats } from "@/library/data";
import { Clock, CheckCircle, DatabaseZap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PendingRecordsStatCard } from '@/components/dashboard/pending-records-stat-card';

const isBrowser = typeof window !== 'undefined';

export default function Home() {
    const [errorLogs, setErrorLogs] = useState<ErrorLogType[]>(() => {
        if (!isBrowser) return [];
        const saved = localStorage.getItem('errorLogs');
        return saved ? JSON.parse(saved) : [];
    });

    const [activityLogs, setActivityLogs] = useState<ActivityLogType[]>(() => {
        if (!isBrowser) return [];
        const saved = localStorage.getItem('activityLogs');
        return saved ? JSON.parse(saved) : [];
    });
    
    const [lastSync, setLastSync] = useState<Date>(() => {
         if (!isBrowser) return replicationStats.lastSync;
         const saved = localStorage.getItem('lastSync');
         return saved ? new Date(JSON.parse(saved)) : replicationStats.lastSync;
    });

    const [refreshPending, setRefreshPending] = useState(0);

    useEffect(() => {
        if(isBrowser) {
            localStorage.setItem('errorLogs', JSON.stringify(errorLogs));
        }
    }, [errorLogs]);

    useEffect(() => {
        if(isBrowser) {
            localStorage.setItem('activityLogs', JSON.stringify(activityLogs));
        }
    }, [activityLogs]);

    useEffect(() => {
        if(isBrowser) {
            localStorage.setItem('lastSync', JSON.stringify(lastSync));
        }
    }, [lastSync]);


    const handleNewLogs = (newActivities: ActivityLogType[], newErrors: ErrorLogType[]) => {
        setActivityLogs(prev => [...newActivities, ...prev].slice(0, 20)); 
        setErrorLogs(prev => [...newErrors, ...prev].slice(0, 20));

        if (newErrors.length === 0 && newActivities.some(a => a.event.includes('completed'))) {
            setLastSync(new Date());
        }
        
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
            value={formatDistanceToNow(lastSync, {
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
