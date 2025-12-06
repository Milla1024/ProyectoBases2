
'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/dashboard/stat-card';
import { PieChart } from 'lucide-react';

type PendingRecordsStatCardProps = {
    refreshKey: number;
}

export function PendingRecordsStatCard({ refreshKey }: PendingRecordsStatCardProps) {
  const [pendingRecords, setPendingRecords] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPendingRecords() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/pending-records');
        if (!response.ok) {
            throw new Error('Failed to fetch');
        }
        const data = await response.json();
        setPendingRecords(data.pendingRecords);
      } catch (error) {
        console.error('Error fetching pending records:', error);
        setPendingRecords(0); // Set to 0 on error to avoid breaking UI
      } finally {
        setIsLoading(false);
      }
    }

    fetchPendingRecords();
  }, [refreshKey]); // Refetch when refreshKey changes

  const displayValue = isLoading ? 'Loading...' : `${pendingRecords ?? 0} records`;

  return (
    <StatCard
      title="Pending Records"
      value={displayValue}
      icon={<PieChart className="h-6 w-6 text-muted-foreground" />}
      description="Total records waiting to sync"
    />
  );
}
