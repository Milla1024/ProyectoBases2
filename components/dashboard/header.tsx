import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import type { ActivityLog, ErrorLog } from "@/components/dashboard/table-selection";

type HeaderProps = {
  activityLogs: ActivityLog[];
  errorLogs: ErrorLog[];
};

export function Header({ activityLogs, errorLogs }: HeaderProps) {

  const downloadFile = (filename: string, content: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadLogs = () => {
    // Format activity logs
    const activityContent = activityLogs
      .map(
        (log) =>
          `[${new Date(log.timestamp).toLocaleString()}] ${log.event}`
      )
      .join("\n");
    downloadFile("Actividad.txt", activityContent || "No activity logs.");

    // Format error logs
    const errorContent = errorLogs
      .map(
        (log) =>
          `[${new Date(
            log.timestamp
          ).toLocaleString()}] [${log.severity.toUpperCase()}] ${log.message}`
      )
      .join("\n");
    downloadFile("Errores.txt", errorContent || "No error logs.");
  };

  return (
    <header className="flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl font-headline">
          DataSync Central
        </h1>
        <p className="text-muted-foreground">
          Monitor and manage your Oracle to MySQL data replication.
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
        <Button variant="outline" onClick={handleDownloadLogs}>
          <Download className="mr-2 h-4 w-4" />
          Download Logs
        </Button>
      </div>
    </header>
  );
}
