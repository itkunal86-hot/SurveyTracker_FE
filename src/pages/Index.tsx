import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { LoginForm } from "@/components/LoginForm";
import { Sidebar } from "@/components/Sidebar";
// ApiStatusBanner intentionally hidden per requirements
import { MapDashboard } from "@/components/MapDashboard";
import { DeviceStatus } from "@/components/DeviceStatus";
import { DailyPersonalMaps } from "./DailyPersonalMaps";
import { PipelineNetworkEditor } from "@/components/PipelineNetworkEditor";
import { ValvePointsEditor } from "@/components/ValvePointsEditor";
import CatastropheManagement from "@/components/CatastropheManagement";
import ValveOperationLog from "@/components/ValveOperationLog";
import { ReportsDashboard } from "@/components/ReportsDashboard";
import { SurveyDashboard } from "@/components/survey/Dashboard";
import { HeatmapView } from "@/components/survey/HeatmapView";
import { AlertsNotifications } from "@/components/survey/AlertsNotifications";
import { SurveyReports } from "@/components/survey/SurveyReports";
import SettingsMaster from "@/components/admin/SettingsMaster";
import { getMetaConfig } from "@/lib/meta";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "manager" | "survey">("admin");
  const [activeTab, setActiveTab] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Restore auth state from session on initial load
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("currentUser");
      if (raw) {
        const user = JSON.parse(raw);
        const roleFromServer = (user?.role as string) || "SURVEY MANAGER";
        let appRole: "admin" | "manager" | "survey" = "survey";
        if (roleFromServer === "ADMIN") appRole = "admin";
        else if (roleFromServer === "MANAGER") appRole = "manager";
        else appRole = "survey";
        setUserRole(appRole);
        setIsAuthenticated(true);
        setActiveTab((appRole === "survey") ? "survey-dashboard" : "dashboard");
      }
    } catch {
      // ignore parse errors and treat as logged out
    }
  }, []);

  // Handle URL parameters for tab switching
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && isAuthenticated) {
      setActiveTab(tabParam);
    }
  }, [searchParams, isAuthenticated]);

  const meta = getMetaConfig("home");

  const handleLogin = (role: "admin" | "manager" | "survey") => {
    setUserRole(role);
    setIsAuthenticated(true);
    // Set default tab based on role
    setActiveTab(role === "survey" ? "survey-dashboard" : "dashboard");
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem("currentUser");
    } catch {}
    setIsAuthenticated(false);
    setActiveTab("");
  };

  const renderContent = () => {
    // Survey manager screens
    if (userRole === "survey") {
      switch (activeTab) {
        case "devices":
          return <DeviceStatus />;
        case "daily-maps":
          return <DailyPersonalMaps />;
        case "survey-dashboard":
          return <SurveyDashboard />;
        case "heatmap-view":
          return <HeatmapView />;
        case "alerts-notifications":
          return <AlertsNotifications />;
        case "survey-reports":
          return <SurveyReports />;
        case "settings":
          return <SettingsMaster />;
        default:
          return <SurveyDashboard />;
      }
    }
    
    // Admin/Manager screens (normal pipeline dashboard)
    switch (activeTab) {
      case "dashboard":
        return <MapDashboard />;
      case "devices":
        return <DeviceStatus />;
      case "daily-maps":
        return <DailyPersonalMaps />;
      case "heatmap-view":
        return <HeatmapView />;
      case "alerts-notifications":
        return <AlertsNotifications />;
      case "pipeline-editor":
        return <PipelineNetworkEditor />;
      case "valve-editor":
        return <ValvePointsEditor />;
      case "catastrophe":
        return <CatastropheManagement />;
      case "valve-operations":
        return <ValveOperationLog />;
      case "reports":
        return <ReportsDashboard />;
      case "settings":
        return <SettingsMaster />;
      default:
        return <MapDashboard />;
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <Helmet>
          <title>{meta.title}</title>
          <meta name="description" content={meta.description} />
          <meta name="keywords" content={meta.keywords} />
          <meta name="author" content={meta.author} />
          <meta property="og:title" content={meta.ogTitle} />
          <meta property="og:description" content={meta.ogDescription} />
          <meta property="og:type" content="website" />
          <meta property="og:image" content={meta.ogImage} />
          <meta property="og:url" content={meta.ogUrl} />
          <meta name="twitter:card" content={meta.twitterCard} />
          <meta name="twitter:site" content={meta.twitterSite} />
          <meta name="twitter:image" content={meta.twitterImage} />
        </Helmet>
        <LoginForm onLogin={handleLogin} />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="keywords" content={meta.keywords} />
        <meta name="author" content={meta.author} />
        <meta property="og:title" content={meta.ogTitle} />
        <meta property="og:description" content={meta.ogDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={meta.ogImage} />
        <meta property="og:url" content={meta.ogUrl} />
        <meta name="twitter:card" content={meta.twitterCard} />
        <meta name="twitter:site" content={meta.twitterSite} />
        <meta name="twitter:image" content={meta.twitterImage} />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userRole={userRole}
          onLogout={handleLogout}
          onCollapsedChange={setSidebarCollapsed}
        />
        <main
          className={`transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}
        >
          {/* Status banner hidden as requested */}
          {renderContent()}
        </main>
      </div>
    </>
  );
};

export default Index;
