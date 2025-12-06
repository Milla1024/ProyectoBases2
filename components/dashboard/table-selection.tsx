"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { tables } from "@/library/data";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Table } from "@/library/data";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type ErrorLog = {
    id: string;
    severity: 'High' | 'Medium' | 'Low';
    timestamp: Date;
    message: string;
};

export type ActivityLog = {
    id: string;
    timestamp: Date;
    event: string;
};

type TableSelectionProps = {
    onReplicationComplete: (activities: ActivityLog[], errors: ErrorLog[]) => void;
}


export function TableSelection({ onReplicationComplete }: TableSelectionProps) {
  const [selectedTable, setSelectedTable] = useState<string>(tables[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleReplicate = async () => {
    if (!selectedTable) {
      toast({
        variant: "destructive",
        title: "No Table Selected",
        description: "Please select a table to replicate.",
      });
      return;
    }

    setIsLoading(true);
    
    const newActivities: ActivityLog[] = [];
    const newErrors: ErrorLog[] = [];
    let totalReplicated = 0;
    let totalErrors = 0;

    try {
      newActivities.push({ id: crypto.randomUUID(), timestamp: new Date(), event: `Sync started for ${selectedTable}` });
      
      // Step 1: MySQL to Oracle
      const response1 = await fetch("/api/replicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: selectedTable,
          direction: "mysql-to-oracle",
        }),
      });

      if (!response1.ok) {
        const errorResult = await response1.json().catch(() => ({ message: 'MySQL to Oracle replication failed with a non-JSON response.' }));
        throw new Error(errorResult.message || "MySQL to Oracle replication failed");
      }
      const result1 = await response1.json();
      
      totalReplicated += result1.replicatedCount;
      if (result1.errors && result1.errors.length > 0) {
        totalErrors += result1.errors.length;
        result1.errors.forEach((e: string) => newErrors.push({ id: crypto.randomUUID(), message: e, severity: 'High', timestamp: new Date() }));
      }


      // Step 2: Oracle to MySQL
      const response2 = await fetch("/api/replicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: selectedTable,
          direction: "oracle-to-mysql",
        }),
      });

      if (!response2.ok) {
         const errorResult = await response2.json().catch(() => ({ message: 'Oracle to MySQL replication failed with a non-JSON response.' }));
        throw new Error(errorResult.message || "Oracle to MySQL replication failed");
      }
      const result2 = await response2.json();
      
      totalReplicated += result2.replicatedCount;
      if (result2.errors && result2.errors.length > 0) {
        totalErrors += result2.errors.length;
        result2.errors.forEach((e: string) => newErrors.push({ id: crypto.randomUUID(), message: e, severity: 'High', timestamp: new Date() }));
      }
      

      newActivities.push({ id: crypto.randomUUID(), timestamp: new Date(), event: `Sync completed for ${selectedTable}. ${totalReplicated} records replicated.` });

      toast({
        title: "Two-Way Replication Complete",
        description: `${totalReplicated} replicated, ${totalErrors} errors.`,
      });

    } catch (error: any) {
       const errorMessage = error.message || "An unexpected error occurred during replication.";
       newErrors.push({ id: crypto.randomUUID(), message: errorMessage, severity: 'High', timestamp: new Date() });
      toast({
        variant: "destructive",
        title: "Replication Error",
        description: errorMessage,
      });
    } finally {
        onReplicationComplete(newActivities, newErrors);
        setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Table Replication</CardTitle>
        <CardDescription>
          Choose a table for a two-way synchronization cycle.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div>
            <Label className="font-medium">Tables</Label>
            <ScrollArea className="mt-2 h-64">
              <RadioGroup
                value={selectedTable}
                onValueChange={setSelectedTable}
                className="space-y-4 pr-6"
                disabled={isLoading}
              >
                {tables.map((table: Table) => (
                  <div
                    key={table.id}
                    className="flex items-center space-x-3 rounded-md border p-3 has-[:checked]:border-primary"
                  >
                    <RadioGroupItem value={table.id} id={table.id} />
                    <Label
                      htmlFor={table.id}
                      className="w-full cursor-pointer text-sm font-medium"
                    >
                      {table.name}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-6 flex justify-end">
        <Button onClick={handleReplicate} disabled={isLoading || !selectedTable}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sync Selected Table
        </Button>
      </CardFooter>
    </Card>
  );
}
