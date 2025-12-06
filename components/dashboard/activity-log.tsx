import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, Loader2, UserCog } from "lucide-react";

export type ActivityLog = {
    id: string;
    timestamp: Date;
    event: string;
};

type ActivityLogProps = {
    logs: ActivityLog[];
}

export function ActivityLog({ logs }: ActivityLogProps) {
    const getEventIcon = (event: string) => {
        if (event.includes('completed')) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
        if (event.includes('started')) return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
        if (event.includes('User triggered')) return <UserCog className="h-4 w-4 text-muted-foreground" />;
        return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
    }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Replication Activity</CardTitle>
        <CardDescription>
          Most recent replication events from the system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {logs.length === 0 && (
                <div className="flex justify-center items-center h-full text-muted-foreground">
                    <p>No activity to display yet.</p>
                </div>
            )}
            {logs.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4">
                <div className="mt-1">{getEventIcon(activity.event)}</div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {activity.event}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
