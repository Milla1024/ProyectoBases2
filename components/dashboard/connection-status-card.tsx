"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MySqlIcon, OracleIcon } from "@/components/icons";

type ConnectionStatus = "Connected" | "Disconnected" | "Checking...";

type ConnectionStatusCardProps = {
  database: "Oracle" | "MySQL";
};

export function ConnectionStatusCard({
  database,
}: ConnectionStatusCardProps) {
  const [status, setStatus] = useState<ConnectionStatus>("Checking...");

  useEffect(() => {
    async function checkStatus() {
      const apiPath = database === "Oracle" ? "/api/status/oracle" : "/api/status/mysql";
      try {
        const response = await fetch(apiPath);
        if (response.ok) {
          const data = await response.json();
          setStatus(data.status);
        } else {
          setStatus("Disconnected");
        }
      } catch (error) {
        setStatus("Disconnected");
      }
    }
    checkStatus();
  }, [database]);


  const isConnected = status === "Connected";
  const isChecking = status === "Checking...";

  const getStatusColor = () => {
    if (isChecking) {
      return "bg-yellow-500";
    }
    return isConnected ? "bg-green-500" : "bg-red-500";
  }

  const getStatusTextColor = () => {
    if (isChecking) {
        return "text-yellow-600 dark:text-yellow-400";
    }
    return isConnected ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  }

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium font-headline">
          {database}
        </CardTitle>
        {database === "Oracle" ? (
          <OracleIcon className="h-6 w-6 text-muted-foreground" />
        ) : (
          <MySqlIcon className="h-6 w-6 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <span
            className={`h-3 w-3 rounded-full ${getStatusColor()}`}
          ></span>
          <p
            className={`text-sm font-medium ${getStatusTextColor()}`}
          >
            {status}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
