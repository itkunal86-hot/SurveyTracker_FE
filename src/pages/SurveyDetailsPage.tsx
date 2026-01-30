import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { SurveyDetails } from "./SurveyDetails";

export default function SurveyDetailsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "manager" | "survey">("admin");

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
      }
    } catch {}
  }, []);

  const activeTab = "devices";

  const handleLogout = () => {
    try { sessionStorage.removeItem("currentUser"); } catch {}
    window.location.href = "/";
  };

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
        <SurveyDetails />
      </main>
    </div>
  );
}
