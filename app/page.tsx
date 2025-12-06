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

function getTodayString() {
    return new Date().toDateString();
}

export default function Home() {
    const [errorLogs, setErrorLogs] = useState<ErrorLogType[]>(() => {
        if (!isBrowser) return [];
        try {
            const saved = localStorage.getItem('errorLogs');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to parse errorLogs from localStorage", e);
            return [];
        }
    });

    const [activityLogs, setActivityLogs] = useState<ActivityLogType[]>(() => {
        if (!isBrowser) return [];
        try {
            const saved = localStorage.getItem('activityLogs');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to parse activityLogs from localStorage", e);
            return [];
        }
    });
    
    const [lastSync, setLastSync] = useState<Date>(() => {
         if (!isBrowser) return replicationStats.lastSync;
         try {
             const saved = localStorage.getItem('lastSync');
             return saved ? new Date(JSON.parse(saved)) : replicationStats.lastSync;
         } catch (e) {
            console.error("Failed to parse lastSync from localStorage", e);
            return replicationStats.lastSync;
         }
    });

    const [replicationsToday, setReplicationsToday] = useState<number>(() => {
        if (!isBrowser) return 0;
        try {
            const savedCount = localStorage.getItem('replicationsToday');
            const savedDate = localStorage.getItem('replicationsDate');
            const today = getTodayString();

            if (savedDate === today && savedCount) {
                return JSON.parse(savedCount);
            }
        } catch (e) {
            console.error("Failed to parse replicationsToday from localStorage", e);
        }
        return 0;
    });

    const [refreshPending, setRefreshPending] = useState(0);

    useEffect(() => {
        if (!isBrowser) return;
        const today = getTodayString();
        const savedDate = localStorage.getItem('replicationsDate');

        if (savedDate !== today) {
            setReplicationsToday(0);
            localStorage.setItem('replicationsToday', JSON.stringify(0));
            localStorage.setItem('replicationsDate', today);
        }
    }, []);

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

    useEffect(() => {
        if (isBrowser) {
            localStorage.setItem('replicationsToday', JSON.stringify(replicationsToday));
            localStorage.setItem('replicationsDate', getTodayString());
        }
    }, [replicationsToday]);


    const handleNewLogs = (newActivities: ActivityLogType[], newErrors: ErrorLogType[]) => {
        // Ensure timestamps are preserved correctly
        const processedActivities = newActivities.map(a => ({...a, timestamp: new Date(a.timestamp)}));
        const processedErrors = newErrors.map(e => ({...e, timestamp: new Date(e.timestamp)}));

        setActivityLogs(prev => [...processedActivities, ...prev].slice(0, 20)); 
        setErrorLogs(prev => [...processedErrors, ...prev].slice(0, 20));

        if (newErrors.length === 0 && newActivities.some(a => a.event.includes('completed'))) {
            const now = new Date();
            setLastSync(now);
            setReplicationsToday(prev => prev + 1);
        }
        
        setRefreshPending(count => count + 1);
    }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="container mx-auto flex-1 space-y-8 p-4 md:p-8">
        <Header activityLogs={activityLogs} errorLogs={errorLogs} />

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <ConnectionStatusCard database="Oracle" />
          <ConnectionStatusCard database="MySQL" />
          <StatCard
            title="Last Successful Sync"
            value={formatDistanceToNow(new Date(lastSync), { // Ensure date is valid for formatting
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
              value={replicationsToday}
              icon={<DatabaseZap className="h-6 w-6 text-muted-foreground" />}
              description="Sync operations performed today"
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
