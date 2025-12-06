import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import type { Log as ErrorLogType } from "@/library/data";
import { ScrollArea } from "../ui/scroll-area";

type ErrorLogProps = {
    logs: ErrorLogType[];
}

export function ErrorLog({ logs }: ErrorLogProps) {
    const getSeverityBadge = (severity: 'High' | 'Medium' | 'Low') => {
        switch (severity) {
            case 'High':
                return <Badge variant="destructive">High</Badge>;
            case 'Medium':
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100/80 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800">Medium</Badge>;
            case 'Low':
                return <Badge variant="outline">Low</Badge>;
        }
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Error & Conflict Logs</CardTitle>
        <CardDescription>
          Identified errors and conflicts from the replication process.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-[100px]">Severity</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="text-right w-[150px]">Timestamp</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {logs.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                            No errors to display.
                        </TableCell>
                    </TableRow>
                )}
                {logs.map((log) => (
                <TableRow key={log.id}>
                    <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                    <TableCell className="font-medium">{log.message}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                        {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
