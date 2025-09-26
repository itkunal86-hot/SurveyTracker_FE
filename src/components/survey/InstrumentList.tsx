import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Eye, Battery, Wifi, WifiOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const InstrumentList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const navigate = useNavigate();

  // Mock data - replace with actual API calls
  const instruments = [
    {
      id: "INS-001",
      serialNumber: "SN123456",
      model: "Model A",
      assignedSurveyor: "John Doe",
      locationStatus: "Surveyor",
      active: true,
      lastSync: "2 mins ago",
      battery: 85,
      healthStatus: "Good",
      totalUsage: 245
    },
    {
      id: "INS-002",
      serialNumber: "SN789012",
      model: "Model B",
      assignedSurveyor: "Jane Smith",
      locationStatus: "In Use",
      active: true,
      lastSync: "5 mins ago",
      battery: 15,
      healthStatus: "Warning",
      totalUsage: 180
    },
    {
      id: "INS-003",
      serialNumber: "SN345678",
      model: "Model A",
      assignedSurveyor: "-",
      locationStatus: "Godown",
      active: false,
      lastSync: "2 hours ago",
      battery: 92,
      healthStatus: "Good",
      totalUsage: 320
    },
  ];

  const filteredInstruments = instruments.filter(instrument => {
    const matchesSearch = instrument.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         instrument.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         instrument.assignedSurveyor.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && instrument.active) ||
                         (statusFilter === "inactive" && !instrument.active);
    
    const matchesLocation = locationFilter === "all" || 
                           instrument.locationStatus.toLowerCase() === locationFilter;
    
    return matchesSearch && matchesStatus && matchesLocation;
  });

  const getBatteryColor = (battery: number) => {
    if (battery < 20) return "text-red-500";
    if (battery < 50) return "text-orange-500";
    return "text-green-500";
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case "Good":
        return <Badge variant="secondary" className="text-green-700 bg-green-100">Good</Badge>;
      case "Warning":
        return <Badge variant="secondary" className="text-orange-700 bg-orange-100">Warning</Badge>;
      case "Critical":
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Instrument List</h1>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, Serial, or Surveyor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Location Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="godown">Godown</SelectItem>
                <SelectItem value="surveyor">Surveyor</SelectItem>
                <SelectItem value="in use">In Use</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instruments ({filteredInstruments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instrument ID</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Assigned Surveyor</TableHead>
                  <TableHead>Location Status</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead>Battery</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Usage (hrs)</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstruments.map((instrument) => (
                  <TableRow key={instrument.id}>
                    <TableCell className="font-medium">{instrument.id}</TableCell>
                    <TableCell>{instrument.serialNumber}</TableCell>
                    <TableCell>{instrument.model}</TableCell>
                    <TableCell>{instrument.assignedSurveyor}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{instrument.locationStatus}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <div className={`h-2 w-2 rounded-full ${instrument.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm">{instrument.active ? 'Active' : 'Inactive'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {instrument.lastSync.includes('mins') ? (
                          <Wifi className="w-3 h-3 text-green-500" />
                        ) : (
                          <WifiOff className="w-3 h-3 text-red-500" />
                        )}
                        <span className="text-sm">{instrument.lastSync}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Battery className={`w-3 h-3 ${getBatteryColor(instrument.battery)}`} />
                        <span className={`text-sm ${getBatteryColor(instrument.battery)}`}>
                          {instrument.battery}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getHealthBadge(instrument.healthStatus)}</TableCell>
                    <TableCell>{instrument.totalUsage}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" onClick={() => navigate(`/daily-personal-maps?device=${encodeURIComponent(instrument.id)}`)}>
                          Instrument
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
