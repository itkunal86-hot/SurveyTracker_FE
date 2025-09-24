import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ValvePointsEditor } from "@/components/ValvePointsEditor";
import { PipelineNetworkEditor } from "@/components/PipelineNetworkEditor";
import CatastropheManagement from "@/components/CatastropheManagement";
import apiClient from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface AssetTypeItem {
  id: string;
  name: string;
  menuName: string | null;
}

const normalizeHeading = (name: string) => name;

export default function AssetMenus() {
  const { menu } = useParams<{ menu: string }>();
  const [assetTypes, setAssetTypes] = useState<AssetTypeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.getAssetTypes({ limit: 100 });
        if (!mounted) return;
        const items = Array.isArray(res?.data) ? res.data : [];
        setAssetTypes(
          items.map((it: any) => ({ id: String(it.id), name: String(it.name), menuName: it.menuName ?? null }))
        );
      } catch {
        setAssetTypes([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const { heading, defaultTab } = useMemo(() => {
    const key = (menu || "pipeline").toLowerCase();
    const findBy = (pred: (a: AssetTypeItem) => boolean) => assetTypes.find(pred);

    if (key === "pipeline") {
      const item = findBy((a) => a.name.toLowerCase() === "pipe" || (a.menuName || "").toLowerCase() === "pipeline");
      return { heading: normalizeHeading(item?.menuName || item?.name || "Pipeline"), defaultTab: "pipelines" as const };
    }
    if (key === "valve") {
      const item = findBy((a) => a.name.toLowerCase() === "valve" || (a.menuName || "").toLowerCase() === "valve");
      return { heading: normalizeHeading(item?.menuName || item?.name || "Valve"), defaultTab: "valves" as const };
    }
    if (key === "catastrophe") {
      const item = findBy((a) => a.name.toLowerCase() === "catastrophe" || (a.menuName || "").toLowerCase().includes("catastrophe"));
      return { heading: normalizeHeading(item?.menuName || item?.name || "Catastrophe Management"), defaultTab: "catastrophes" as const };
    }
    return { heading: normalizeHeading("Pipeline"), defaultTab: "pipelines" as const };
  }, [menu, assetTypes]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-64 bg-muted animate-pulse rounded" />
          <Button asChild variant="ghost" disabled>
            <span className="flex items-center"><ArrowLeft className="h-4 w-4 mr-2" />Back</span>
          </Button>
        </div>
        <div className="h-[600px] bg-muted animate-pulse rounded" />
      </div>
    );
  }

  const key = (menu || "pipeline").toLowerCase();

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{heading}</h1>
        <Button asChild variant="ghost" onClick={() => window.history.back()}>
          <span className="flex items-center"><ArrowLeft className="h-4 w-4 mr-2" />Back</span>
        </Button>
      </div>
      {key === "pipeline" && <PipelineNetworkEditor />}
      {key === "valve" && <ValvePointsEditor />}
      {key === "catastrophe" && <CatastropheManagement />}
    </div>
  );
}
