import { useParams, useNavigate } from "react-router-dom";
import { DeviceStatisticsAnalytics } from "@/components/survey/DeviceStatisticsAnalytics";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const DeviceStatisticsPage = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Device Statistics</h1>
        {deviceId && <span className="text-lg text-muted-foreground">Device ID: {deviceId}</span>}
      </div>

      <DeviceStatisticsAnalytics deviceId={deviceId} />
    </div>
  );
};
