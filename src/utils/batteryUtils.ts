/**
 * Maps battery level to a color class
 * @param battery - Battery percentage (0-100)
 * @returns Tailwind color class for text
 */
export const getBatteryColor = (battery?: number): string => {
  if (battery === undefined || battery === null) return "text-muted-foreground";
  if (battery < 20) return "text-red-500";
  if (battery < 50) return "text-orange-500";
  return "text-green-500";
};

/**
 * Maps battery level to a border color class
 * @param battery - Battery percentage (0-100)
 * @returns Tailwind border color class
 */
export const getBatteryBorderColor = (battery?: number): string => {
  if (battery === undefined || battery === null) return "border-l-gray-400";
  if (battery < 20) return "border-l-red-500";
  if (battery < 50) return "border-l-orange-500";
  return "border-l-green-500";
};


/**
 * Maps alert severity to a border color class
 * @param severity - Alert severity level
 * @returns Tailwind border color class
 */
export const getAlertSeverityBorderColor = (severity?: string): string => {
  if (!severity) return "border-l-gray-400";
  switch (severity) {
    case "UNSPECIFIED_FAILURE":
    case "DEAD":
    case "COLD":
      return "border-l-red-500";
    case "OVER_HEAT":
    case "OVER_VOLTAGE":
      return "border-l-orange-500";
    case "GOOD":
      return "border-l-green-500";
    case "UNKNOWN":
      return "border-l-gray-500";
    default:
      return "border-l-gray-400";
  }
};
export const getAlertBadgeBgColor = (severity?: string): string => {
  if (!severity) return "border-l-gray-400";
  switch (severity) {
    case "UNSPECIFIED_FAILURE":
    case "DEAD":
    case "COLD":
      return "bg-destructive";
    case "OVER_HEAT":
    case "OVER_VOLTAGE":
      return "bg-warning";
    case "GOOD":
      return "bg-success";
    case "UNKNOWN":
      return "bg-secondary";
    default:
      return "bg-secondary";
  }
};



