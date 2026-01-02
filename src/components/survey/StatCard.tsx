import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  description?: string;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  variant?: "default" | "success" | "warning" | "destructive";
}

export const StatCard = ({
  title,
  value,
  icon: Icon,
  iconColor = "text-muted-foreground",
  description,
  trend,
  variant = "default",
}: StatCardProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "border-l-4 border-l-green-500";
      case "warning":
        return "border-l-4 border-l-yellow-500";
      case "destructive":
        return "border-l-4 border-l-red-500";
      default:
        return "border-l-4 border-l-blue-500";
    }
  };

  return (
    <Card className={`${getVariantStyles()}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{value}</p>
              {trend && (
                <p
                  className={`text-sm font-medium ${
                    trend.direction === "up"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {trend.direction === "up" ? "↑" : "↓"} {trend.value}%
                </p>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-2">{description}</p>
            )}
          </div>
          {Icon && <Icon className={`h-5 w-5 ${iconColor}`} />}
        </div>
      </CardContent>
    </Card>
  );
};
