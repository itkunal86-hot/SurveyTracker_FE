import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Map,
  Users,
  Monitor,
  Calendar,
  Settings,
  Network as Pipe,
  Gauge,
  AlertTriangle,
  FileText,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronDown,
  Check,
  Activity,
  Lock,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSurveyContext } from "@/contexts/SurveyContext";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: "admin" | "manager" | "survey";
  onLogout: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  roles: ("admin" | "manager" | "survey")[];
}

const adminManagerMenuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "Map Dashboard",
    icon: Map,
    roles: ["admin", "manager"],
  },
  {
    id: "pipeline-operations",
    label: "Pipeline Operations",
    icon: Activity,
    roles: ["admin", "manager"],
  },
  {
    id: "devices",
    label: "Device Status",
    icon: Monitor,
    roles: ["admin", "survey"],
  },
  {
    id: "daily-maps",
    label: "Daily Personal Maps",
    icon: Calendar,
    roles: ["admin", "survey"],
  },
  {
    id: "pipeline-editor",
    label: "Pipeline Network",
    icon: Pipe,
    roles: ["admin", "manager"],
  },
  { id: "valve-editor", label: "Valve Points", icon: Gauge, roles: ["admin", "manager"] },
  {
    id: "catastrophe",
    label: "Catastrophe Management",
    icon: AlertTriangle,
    roles: ["admin", "manager"],
  },
  {
    id: "valve-operations",
    label: "Valve Operations",
    icon: Settings,
    roles: ["admin", "manager"],
  },
  {
    id: "reports",
    label: "Reports & Export",
    icon: FileText,
    roles: ["admin", "manager"],
  },
];

const surveyMenuItems: MenuItem[] = [
  {
    id: "devices",
    label: "Instrument List",
    icon: Monitor,
    roles: ["survey"],
  },
  {
    id: "daily-maps",
    label: "Daily Personal Maps",
    icon: Calendar,
    roles: ["survey"],
  },
  {
    id: "survey-dashboard",
    label: "Dashboard",
    icon: Monitor,
    roles: ["survey"],
  },
  {
    id: "instrument-list",
    label: "Instrument List",
    icon: Users,
    roles: ["survey"],
  },
  {
    id: "heatmap-view",
    label: "Heatmap View",
    icon: Map,
    roles: ["survey"],
  },
  {
    id: "alerts-notifications",
    label: "Alerts & Notifications",
    icon: AlertTriangle,
    roles: ["survey"],
  },
  {
    id: "survey-reports",
    label: "Reports",
    icon: FileText,
    roles: ["survey"],
  },
];

export const Sidebar = ({
  activeTab,
  onTabChange,
  userRole,
  onLogout,
  onCollapsedChange,
}: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const navigate = useNavigate();
  const { activeSurveys, currentSurvey, setCurrentSurvey, isLoading } = useSurveyContext();

  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapsedChange?.(newCollapsed);
  };

  const menuItems = userRole === "survey" ? surveyMenuItems : adminManagerMenuItems;
  const filteredItems = menuItems.filter(
    (item) =>
      item.roles.includes(userRole) &&
      item.id !== "instrument-list" &&
      item.id !== "pipeline-operations" &&
      item.id !== "valve-operations"
  );

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    if (tabId === "pipeline-operations") {
      navigate("/pipeline-operations");
    } else {
      navigate("/", { replace: true });
    }
  };

  const currentUserEmail = (() => {
    try {
      const raw = sessionStorage.getItem("currentUser");
      if (!raw) return "";
      const user = JSON.parse(raw);
      return user?.email || "";
    } catch {
      return "";
    }
  })();

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 flex flex-col z-40",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Gauge className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">Survey Management</h2>
                <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            {isCollapsed && currentSurvey && (
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" title={`Active: ${currentSurvey.name}`} />
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleCollapse}
              className="h-8 w-8"
              title={isCollapsed && currentSurvey ? `Current Survey: ${currentSurvey.name}` : undefined}
            >
              {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Survey</label>
            {isLoading ? (
              <div className="h-8 bg-muted animate-pulse rounded-md" />
            ) : (
              <Select
                value={currentSurvey?.id || ""}
                onValueChange={(value) => {
                  const selected = activeSurveys.find(s => s.id === value);
                  if (selected) {
                    setCurrentSurvey(selected);
                  }
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select active survey">
                    {currentSurvey && (
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-2 h-2 bg-success rounded-full flex-shrink-0" />
                        <span className="truncate">{currentSurvey.name}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {activeSurveys.map((survey) => (
                    <SelectItem key={survey.id} value={survey.id}>
                      <div className="flex items-center gap-2 w-full">
                        <div className="w-2 h-2 bg-success rounded-full flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{survey.name}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs px-1 py-0">{survey.categoryName}</Badge>
                            <span>
                              {new Date(survey.startDate).toLocaleDateString()} -
                              {new Date(survey.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {currentSurvey?.id === survey.id && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {currentSurvey && !isLoading && (
              <div className="text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs px-1 py-0">{currentSurvey.categoryName}</Badge>
                  <span>•</span>
                  <span>ID: {currentSurvey.id}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start h-10",
                isCollapsed && "px-2",
                isActive && "bg-primary/10 text-primary border border-primary/20",
              )}
              onClick={() => handleTabChange(item.id)}
            >
              <Icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Button>
          );
        })}
      </nav>

      {userRole === "admin" && (
        <div className="p-2 border-t border-border">
          <Button
            variant="outline"
            className={cn("w-full justify-start h-10 mb-2", isCollapsed && "px-2")}
            onClick={() => navigate("/admin")}
          >
            <Shield className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
            {!isCollapsed && <span className="text-sm font-medium">Admin Panel</span>}
          </Button>
        </div>
      )}

      <div className="p-2 border-t border-border space-y-2">
        <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className={cn("w-full justify-start h-10", isCollapsed && "px-2")}
            >
              <Lock className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
              {!isCollapsed && <span className="text-sm font-medium">Change Password</span>}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl p-0">
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
            </DialogHeader>
            <div className="p-6">
              <ChangePasswordForm
                userEmail={currentUserEmail}
                onSuccess={() => { setIsChangePasswordOpen(false); onLogout(); }}
                onCancel={() => setIsChangePasswordOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>

        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start h-10 text-destructive hover:text-destructive hover:bg-destructive/10",
            isCollapsed && "px-2",
          )}
          onClick={onLogout}
        >
          <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </Button>
      </div>
    </div>
  );
};
