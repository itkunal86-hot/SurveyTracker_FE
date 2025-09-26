import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ValvePointsEditor } from "@/components/ValvePointsEditor";
import { PipelineNetworkEditor } from "@/components/PipelineNetworkEditor";
import CatastropheManagement from "@/components/CatastropheManagement";
import { CatastrophePointsEditor } from "@/components/CatastrophePointsEditor";
import apiClient from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";

interface AssetTypeItem {
  id: string;
  name: string;
  menuName: string | null;
  isSurveyElement: boolean;
}

const normalizeHeading = (name: string) => name;

export default function AssetMenus() {
  const { menu } = useParams<{ menu: string }>();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<"admin" | "manager" | "survey">("admin");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("currentUser");
      if (raw) {
        const user = JSON.parse(raw);
        const roleFromServer = (user?.role as string) || "SURVEY_MANAGER";
        let appRole: "admin" | "manager" | "survey" = "survey";
        if (roleFromServer === "ADMIN") appRole = "admin";
        else if (roleFromServer === "MANAGER") appRole = "manager";
        else appRole = "survey";
        setUserRole(appRole);
      }
    } catch {}
  }, []);

  const handleLogout = () => {
    try {
      sessionStorage.removeItem("currentUser");
    } catch {}
    navigate("/");
  };

  const activeTab = `assets:${(menu || "pipeline").toLowerCase()}`;
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
          items.map((it: any) => ({ id: String(it.id), name: String(it.name), menuName: it.menuName ?? null, isSurveyElement: Boolean(it.isSurveyElement) }))
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
      <div className="min-h-screen bg-background">
        <Sidebar
          activeTab={activeTab}
          onTabChange={() => {}}
          userRole={userRole}
          onLogout={handleLogout}
          onCollapsedChange={setSidebarCollapsed}
        />
        <main className={`transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-64 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-[600px] bg-muted animate-pulse rounded" />
          </div>
        </main>
      </div>
    );
  }

  const key = (menu || "pipeline").toLowerCase();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        activeTab={activeTab}
        onTabChange={() => {}}
        userRole={userRole}
        onLogout={handleLogout}
        onCollapsedChange={setSidebarCollapsed}
      />
      <main className={`transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{heading}</h1>
          </div>
          {key === "pipeline" && <PipelineNetworkEditor />}
          {key === "valve" && <ValvePointsEditor />}
          {key === "catastrophe" && <CatastrophePointsEditor />}
        </div>
      </main>
    </div>
  );
}
