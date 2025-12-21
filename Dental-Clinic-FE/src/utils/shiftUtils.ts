
export const getShiftTypeLabel = (shiftType: string | undefined, t: any): string => {
  if (!shiftType || shiftType === "FULL_DAY") {
    return t("leaveRequest.shiftTypes.fullDay", "Full Day");
  }
  
  switch (shiftType.toUpperCase()) {
    case "MORNING":
      return t("leaveRequest.shiftTypes.morning", "Morning");
    case "AFTERNOON":
      return t("leaveRequest.shiftTypes.afternoon", "Afternoon");
    case "EVENING":
      return t("leaveRequest.shiftTypes.evening", "Evening");
    default:
      return shiftType;
  }
};

/**
 * Get shift type icon
 * @param shiftType - Shift type
 * @returns Icon class or emoji
 */
export const getShiftTypeIcon = (shiftType?: string): string => {
  if (!shiftType || shiftType === "FULL_DAY") {
    return "☀️";
  }
  
  switch (shiftType.toUpperCase()) {
    case "MORNING":
      return "🌅";
    case "AFTERNOON":
      return "☀️";
    case "EVENING":
      return "🌙";
    default:
      return "⏰";
  }
};

/**
 * Get shift type color classes
 * @param shiftType - Shift type
 * @returns Tailwind color classes
 */
export const getShiftTypeColor = (shiftType?: string): string => {
  if (!shiftType || shiftType === "FULL_DAY") {
    return "text-blue-600 bg-blue-50";
  }
  
  switch (shiftType.toUpperCase()) {
    case "MORNING":
      return "text-orange-600 bg-orange-50";
    case "AFTERNOON":
      return "text-yellow-600 bg-yellow-50";
    case "EVENING":
      return "text-purple-600 bg-purple-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};
