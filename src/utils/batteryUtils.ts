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
