import { useEffect, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { apiClient, type AssetType } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle } from "lucide-react";

export default function ExportImport() {
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [selectedAssetTypeId, setSelectedAssetTypeId] = useState<string>("");
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const { toast } = useToast();

  // Load asset types on component mount
  useEffect(() => {
    const fetchAssetTypes = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.getAssetTypes({ limit: 100 });
        setAssetTypes(res.data || []);
      } catch (error) {
        console.error("Error fetching asset types:", error);
        toast({ title: "Error", description: "Failed to load asset types" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssetTypes();
  }, [toast]);

  const handleAssetTypeChange = (assetTypeId: string) => {
    setSelectedAssetTypeId(assetTypeId);
    const selected = assetTypes.find((at) => at.id === assetTypeId);
    setSelectedAssetType(selected || null);
    setMessage(null);
  };

  const handleExport = async () => {
    if (!selectedAssetType) return;

    setIsExporting(true);
    setMessage(null);
    try {
      // API endpoint call for export with selected asset type ID
      const response = await fetch(
        `https://localhost:7215/api/AssetTypes/export?assetTypeId=${selectedAssetType.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Export failed with status ${response.status}`);
      }

      // Handle the response (could be JSON or file download)
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        // Trigger download if data contains file information
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `export-${selectedAssetType.name}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Handle file download directly
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `export-${selectedAssetType.name}-${Date.now()}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      setMessage({
        type: "success",
        text: `Successfully exported ${selectedAssetType.name} data`,
      });
      toast({
        title: "Export Successful",
        description: `${selectedAssetType.name} data has been exported`,
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      setMessage({
        type: "error",
        text: `Failed to export ${selectedAssetType.name} data`,
      });
      toast({
        title: "Export Failed",
        description: "There was an error exporting the data",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    if (!selectedAssetType) return;

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".csv,.xlsx,.kml";

    fileInput.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      setIsImporting(true);
      setMessage(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("assetType", selectedAssetType.name);

        // detect extension
        const fileName = file.name.toLowerCase();

        let apiUrl = "";
        if (fileName.endsWith(".kml")) {
          apiUrl = `https://localhost:7215/api/SurveyEntries/upload-kml`;
        } else {
          apiUrl = `https://localhost:7215/api/SurveyEntries/upload-assets`;
        }

        const response = await fetch(apiUrl, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Import failed with status ${response.status}`);
        }

        const result = await response.json();
       
        setMessage({
          type: "success",
          text: `Successfully imported data for ${selectedAssetType.name}`,
        });

        toast({
          title: "Import Successful",
          description: `Data for ${selectedAssetType.name} has been imported`,
        });
      } catch (error) {
        console.error("Error importing data:", error);

        setMessage({
          type: "error",
          text: `Failed to import data for ${selectedAssetType.name}`,
        });

        toast({
          title: "Import Failed",
          description: "There was an error importing the data",
        });
      } finally {
        setIsImporting(false);
      }
    };

    fileInput.click();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Export & Import Data</CardTitle>
            <CardDescription>
              Select an asset type to export or import its data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Asset Type Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="asset-type-select">Asset Type</Label>
              <Select
                value={selectedAssetTypeId}
                onValueChange={handleAssetTypeChange}
                disabled={isLoading}
              >
                <SelectTrigger id="asset-type-select" className="w-full">
                  <SelectValue placeholder="Select an asset type..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      Loading asset types...
                    </div>
                  ) : assetTypes.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No asset types found
                    </div>
                  ) : (
                    assetTypes.map((assetType) => (
                      <SelectItem key={assetType.id} value={assetType.id}>
                        <div>
                          <div className="font-medium">{assetType.name}</div>
                          {assetType.menuName && (
                            <div className="text-sm text-muted-foreground">
                              ({assetType.menuName})
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Asset Type Info */}
            {selectedAssetType && (
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div>
                  <span className="text-sm font-medium">Name:</span>
                  <span className="ml-2 text-sm">{selectedAssetType.name}</span>
                </div>
                {selectedAssetType.menuName && (
                  <div>
                    <span className="text-sm font-medium">Menu Name:</span>
                    <span className="ml-2 text-sm">{selectedAssetType.menuName}</span>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium">ID:</span>
                  <span className="ml-2 text-sm">{selectedAssetType.id}</span>
                </div>
              </div>
            )}

            {/* Message Display */}
            {message && (
              <Alert variant={message.type === "success" ? "default" : "destructive"}>
                {message.type === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            {/* Export and Import Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleExport}
                disabled={!selectedAssetType || isExporting}
                className="flex-1"
                variant="default"
              >
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? "Exporting..." : "Export Data"}
              </Button>
              <Button
                onClick={handleImport}
                disabled={!selectedAssetType || isImporting}
                className="flex-1"
                variant="outline"
              >
                <Upload className="mr-2 h-4 w-4" />
                {isImporting ? "Importing..." : "Import Data"}
              </Button>
            </div>

            {/* Help Text */}
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Export:</strong> Downloads the selected asset type data as a JSON file.
              </p>
              <p>
                <strong>Import:</strong> Upload a previously exported JSON or CSV file to import
                data for the selected asset type.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
