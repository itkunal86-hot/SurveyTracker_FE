import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { LoginForm } from "@/components/LoginForm";
import { Sidebar } from "@/components/Sidebar";
import { ApiStatusBanner } from "@/components/ApiStatusBanner";
import { MapDashboard } from "@/components/MapDashboard";
import { DeviceStatus } from "@/components/DeviceStatus";
import { DailyPersonalMaps } from "./DailyPersonalMaps";
import { PipelineNetworkEditor } from "@/components/PipelineNetworkEditor";
import { ValvePointsEditor } from "@/components/ValvePointsEditor";
import CatastropheManagement from "@/components/CatastropheManagement";
import ValveOperationLog from "@/components/ValveOperationLog";
import { ReportsDashboard } from "@/components/ReportsDashboard";
import { SurveyDashboard } from "@/components/survey/Dashboard";
import { InstrumentList } from "@/components/survey/InstrumentList";
import { InstrumentDetail } from "@/components/survey/InstrumentDetail";
import { HeatmapView } from "@/components/survey/HeatmapView";
import { AlertsNotifications } from "@/components/survey/AlertsNotifications";
import { SurveyReports } from "@/components/survey/SurveyReports";
import { getMetaConfig } from "@/lib/meta";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "manager" | "survey">("admin");
  const [activeTab, setActiveTab] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
        case "instrument-list":
          return <InstrumentList />;
        case "instrument-detail":
          return <InstrumentDetail onBack={() => setActiveTab("instrument-list")} />;
        case "heatmap-view":
          return <HeatmapView />;
        case "alerts-notifications":
          return <AlertsNotifications />;
        case "survey-reports":
          return <SurveyReports />;
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
          <div className="p-4">
            <ApiStatusBanner />
          </div>
          {renderContent()}
        </main>
      </div>
    </>
  );
};

export default Index;
