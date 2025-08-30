import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Filter } from "lucide-react";
import { ValveOperation, Valve } from "@/types/valve";

interface ValveOperationStatsProps {
  operations: ValveOperation[];
  valves: Valve[];
  getValveCurrentStatus: (valveId: string) => 'open' | 'closed';
}

export const ValveOperationStats = ({ 
  operations, 
  valves, 
  getValveCurrentStatus 
}: ValveOperationStatsProps) => {
  const stats = {
    totalOperations: operations.length,
    todayOperations: operations.filter(op => {
      const today = new Date();
      const opDate = op.actionTimestamp;
      return opDate.toDateString() === today.toDateString();
    }).length,
    closedValves: valves.filter(valve => getValveCurrentStatus(valve.id) === 'closed').length,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalOperations}</div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Operations</CardTitle>
          <Filter className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.todayOperations}</div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Closed Valves</CardTitle>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{stats.closedValves}</div>
        </CardContent>
      </Card>
    </div>
  );
};