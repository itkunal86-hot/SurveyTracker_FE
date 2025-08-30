import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Battery, MapPin, Activity, Wrench, Wifi } from "lucide-react";

interface InstrumentDetailProps {
  instrumentId?: string;
  onBack: () => void;
}

export const InstrumentDetail = ({ instrumentId = "INS-001", onBack }: InstrumentDetailProps) => {
  // Mock data - replace with actual API call
  const instrument = {
    id: "INS-001",
    serialNumber: "SN123456",
    model: "Model A",
    currentStatus: "Active",
    assignedSurveyor: {
      name: "John Doe",
      id: "SUR-001",
      phone: "+91 98765 43210",
      email: "john.doe@company.com"
    },
    location: {
      latitude: 28.7041,
      longitude: 77.1025,
      lastKnown: "2 mins ago"
    },
    usage: {
      totalHours: 245,
      sessions: [
        { start: "2024-01-20 09:00", end: "2024-01-20 17:30", duration: 8.5 },
        { start: "2024-01-19 08:30", end: "2024-01-19 16:15", duration: 7.75 },
        { start: "2024-01-18 10:00", end: "2024-01-18 18:00", duration: 8.0 },
      ]
    },
    health: {
      battery: 85,
      healthStatus: "Good",
      lastSync: "2 mins ago",
      maintenanceHistory: [
        { date: "2024-01-15", type: "Calibration", notes: "Regular calibration check" },
        { date: "2024-01-01", type: "Battery Replacement", notes: "Replaced with new battery" },
      ]
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
        <h1 className="text-3xl font-bold">Instrument Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instrument Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Instrument Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Instrument ID</label>
                <p className="text-lg font-semibold">{instrument.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Serial Number</label>
                <p className="text-lg font-semibold">{instrument.serialNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Model</label>
                <p className="text-lg">{instrument.model}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Current Status</label>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span>{instrument.currentStatus}</span>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <label className="text-sm font-medium text-muted-foreground">Assigned Surveyor</label>
              <div className="mt-2 space-y-1">
                <p className="font-semibold">{instrument.assignedSurveyor.name}</p>
                <p className="text-sm text-muted-foreground">{instrument.assignedSurveyor.id}</p>
                <p className="text-sm">{instrument.assignedSurveyor.phone}</p>
                <p className="text-sm">{instrument.assignedSurveyor.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Location</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Latitude</label>
                <p className="text-lg font-mono">{instrument.location.latitude}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Longitude</label>
                <p className="text-lg font-mono">{instrument.location.longitude}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Known Location</label>
              <p className="text-sm">{instrument.location.lastKnown}</p>
            </div>
            <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MapPin className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Mini map view</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Usage Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Total Usage Hours</label>
              <p className="text-2xl font-bold">{instrument.usage.totalHours} hrs</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Recent Usage Sessions</label>
              <div className="mt-2 space-y-2">
                {instrument.usage.sessions.map((session, index) => (
                  <div key={index} className="flex justify-between items-center p-2 border rounded">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {new Date(session.start).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.start).toLocaleTimeString()} - {new Date(session.end).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge variant="outline">{session.duration} hrs</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Battery className="w-5 h-5" />
              <span>Health Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Battery Level</label>
                <div className="flex items-center space-x-2">
                  <Battery className="w-4 h-4 text-green-500" />
                  <span className="text-lg font-semibold text-green-600">{instrument.health.battery}%</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Health Status</label>
                <Badge variant="secondary" className="text-green-700 bg-green-100">
                  {instrument.health.healthStatus}
                </Badge>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Sync</label>
              <div className="flex items-center space-x-2">
                <Wifi className="w-4 h-4 text-green-500" />
                <span>{instrument.health.lastSync}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Maintenance History</label>
              <div className="mt-2 space-y-2">
                {instrument.health.maintenanceHistory.map((maintenance, index) => (
                  <div key={index} className="flex justify-between items-start p-2 border rounded">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Wrench className="w-3 h-3" />
                        <span className="text-sm font-medium">{maintenance.type}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{maintenance.notes}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{maintenance.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};