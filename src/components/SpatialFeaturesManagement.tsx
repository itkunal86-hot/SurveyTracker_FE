import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, Ruler, Settings, Calendar, Gauge, Users, FileText, Shield } from "lucide-react";
import { usePipelines } from "@/hooks/useApiQueries";
import { PipelineAdapter } from "@/lib/pipelineUtils";

export function SpatialFeaturesManagement() {
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const { data: pipelinesData, isLoading } = usePipelines({ limit: 100 });

  const pipelines = pipelinesData?.data || [];

  if (isLoading) {
    return <div className="p-6">Loading spatial features...</div>;
  }

  const selectedPipelineData = pipelines.find(p => p.id === selectedPipeline);
  const adapter = selectedPipelineData ? PipelineAdapter.from(selectedPipelineData) : null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Spatial Features Management</h1>
          <p className="text-muted-foreground">
            Comprehensive attribute management for pipeline infrastructure
          </p>
        </div>
        <Button>Import Spatial Data</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipelines</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelines.length}</div>
            <p className="text-xs text-muted-foreground">Active segments</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Length</CardTitle>
            <Ruler className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pipelines.reduce((sum, p) => sum + (p.specifications?.length?.value || 0), 0).toFixed(1)} m
            </div>
            <p className="text-xs text-muted-foreground">Combined length</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Materials</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(pipelines.map(p => p.specifications?.material)).size}
            </div>
            <p className="text-xs text-muted-foreground">Different types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Age</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(pipelines.reduce((sum, p) => sum + (new Date().getFullYear() - (p.installation?.installationYear || 2020)), 0) / pipelines.length)} years
            </div>
            <p className="text-xs text-muted-foreground">Installation age</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Pipeline Segments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pipelines.map((pipeline) => (
              <div
                key={pipeline.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedPipeline === pipeline.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-muted/50"
                }`}
                onClick={() => setSelectedPipeline(pipeline.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{pipeline.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {pipeline.specifications?.diameter.value} {pipeline.specifications?.diameter.unit} • {pipeline.specifications?.material}
                    </p>
                  </div>
                  <Badge variant={pipeline.status === "OPERATIONAL" ? "default" : "secondary"}>
                    {pipeline.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Detailed View */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedPipelineData ? selectedPipelineData.name : "Select a Pipeline"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {adapter ? (
              <Tabs defaultValue="specifications" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="specifications">Specs</TabsTrigger>
                  <TabsTrigger value="pressure">Pressure</TabsTrigger>
                  <TabsTrigger value="installation">Install</TabsTrigger>
                  <TabsTrigger value="consumer">Consumer</TabsTrigger>
                  <TabsTrigger value="geolocation">Location</TabsTrigger>
                  <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                </TabsList>

                <TabsContent value="specifications" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Diameter</Label>
                      <div className="text-2xl font-bold">
                        {adapter.specifications.diameter.value} {adapter.specifications.diameter.unit}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Nominal: {adapter.specifications.diameter.nominalSize}
                      </p>
                    </div>
                    <div>
                      <Label>Material</Label>
                      <div className="text-2xl font-bold">{adapter.specifications.material}</div>
                      <p className="text-sm text-muted-foreground">
                        Grade: {adapter.specifications.materialGrade || "Standard"}
                      </p>
                    </div>
                    <div>
                      <Label>Length</Label>
                      <div className="text-2xl font-bold">
                        {adapter.specifications.length?.value} {adapter.specifications.length?.unit}
                      </div>
                    </div>
                    <div>
                      <Label>Wall Thickness</Label>
                      <div className="text-2xl font-bold">
                        {adapter.specifications.wallThickness || "N/A"} mm
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pressure" className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <Gauge className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <div className="text-2xl font-bold">
                        {adapter.operatingPressure.nominal}
                      </div>
                      <p className="text-sm text-muted-foreground">Nominal {adapter.operatingPressure.unit}</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Gauge className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                      <div className="text-2xl font-bold">
                        {adapter.operatingPressure.minimum}
                      </div>
                      <p className="text-sm text-muted-foreground">Minimum {adapter.operatingPressure.unit}</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Gauge className="h-8 w-8 mx-auto mb-2 text-red-500" />
                      <div className="text-2xl font-bold">
                        {adapter.operatingPressure.maximum}
                      </div>
                      <p className="text-sm text-muted-foreground">Maximum {adapter.operatingPressure.unit}</p>
                    </div>
                  </div>
                  {adapter.operatingPressure.testPressure && (
                    <div className="p-4 bg-muted rounded-lg">
                      <Label>Test Pressure</Label>
                      <div className="text-xl font-bold">
                        {adapter.operatingPressure.testPressure} {adapter.operatingPressure.unit}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="installation" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Installation Year</Label>
                      <div className="text-2xl font-bold">{adapter.installation.installationYear}</div>
                    </div>
                    <div>
                      <Label>Commissioning Date</Label>
                      <div className="text-lg">{adapter.installation.commissioningDate || "N/A"}</div>
                    </div>
                    <div>
                      <Label>Installation Method</Label>
                      <div className="text-lg">{adapter.installation.installationMethod || "N/A"}</div>
                    </div>
                    <div>
                      <Label>Depth</Label>
                      <div className="text-lg">
                        {adapter.installation.depth?.value} {adapter.installation.depth?.unit}
                      </div>
                    </div>
                  </div>
                  {adapter.installation.contractor && (
                    <div className="space-y-2">
                      <Label>Installation Details</Label>
                      <div className="space-y-1 text-sm">
                        <p><strong>Contractor:</strong> {adapter.installation.contractor}</p>
                        <p><strong>Inspector:</strong> {adapter.installation.inspector}</p>
                        <p><strong>Soil Type:</strong> {adapter.installation.soilType}</p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="consumer" className="space-y-4">
                  {adapter.consumerCategory ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Consumer Type</Label>
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          <span className="text-lg font-medium">{adapter.consumerCategory.type}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {adapter.consumerCategory.subCategory}
                        </p>
                      </div>
                      <div>
                        <Label>Priority Level</Label>
                        <Badge variant={adapter.consumerCategory.priority === "HIGH" ? "destructive" : "secondary"}>
                          {adapter.consumerCategory.priority}
                        </Badge>
                      </div>
                      <div>
                        <Label>Estimated Consumption</Label>
                        <div className="text-2xl font-bold">
                          {adapter.consumerCategory.estimatedConsumption} m³/day
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No consumer category data available</p>
                  )}
                </TabsContent>

                <TabsContent value="geolocation" className="space-y-4">
                  <div>
                    <Label>Coordinate Points</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Point Type</TableHead>
                          <TableHead>Latitude</TableHead>
                          <TableHead>Longitude</TableHead>
                          <TableHead>Elevation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPipelineData.coordinates.map((coord, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Badge variant="outline">{coord.pointType}</Badge>
                            </TableCell>
                            <TableCell>{coord.lat.toFixed(6)}</TableCell>
                            <TableCell>{coord.lng.toFixed(6)}</TableCell>
                            <TableCell>{coord.elevation || "N/A"} m</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {adapter.elevationProfile && (
                    <div>
                      <Label>Elevation Profile</Label>
                      <p className="text-sm text-muted-foreground">
                        Overall gradient: {adapter.elevationProfile.gradient}%
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="maintenance" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Last Inspection</Label>
                      <div className="text-lg">{selectedPipelineData.lastInspection || "N/A"}</div>
                    </div>
                    <div>
                      <Label>Next Inspection</Label>
                      <div className="text-lg">{selectedPipelineData.nextInspection || "N/A"}</div>
                    </div>
                  </div>
                  
                  {adapter.maintenanceHistory && adapter.maintenanceHistory.length > 0 && (
                    <div>
                      <Label>Maintenance History</Label>
                      <div className="space-y-2 mt-2">
                        {adapter.maintenanceHistory.map((record, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <Badge>{record.type}</Badge>
                              <span className="text-sm text-muted-foreground">{record.date}</span>
                            </div>
                            <p className="text-sm mt-1">{record.description}</p>
                            {record.cost && (
                              <p className="text-xs text-muted-foreground">Cost: ${record.cost}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {adapter.standards && (
                    <div>
                      <Label>Standards & Certifications</Label>
                      <div className="flex gap-2 mt-2">
                        {adapter.standards.map((standard, index) => (
                          <Badge key={index} variant="outline">
                            <Shield className="h-3 w-3 mr-1" />
                            {standard}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a pipeline segment to view detailed attributes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SpatialFeaturesManagement;