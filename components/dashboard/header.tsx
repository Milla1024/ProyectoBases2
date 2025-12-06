import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";

export function Header() {
  return (
    <header className="flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl font-headline">
          Bicicletas DataSync
        </h1>
        <p className="text-muted-foreground">
          Monitorear y administrar bases de datos Oracle y SQL
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Button>
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync
        </Button>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Descargar Logs
        </Button>
      </div>
    </header>
  );
}
