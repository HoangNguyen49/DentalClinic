
export const WORK_HOURS_CONSTANTS = {
  // Thời gian nghỉ trưa
  LUNCH_BREAK_START: "11:00",
  LUNCH_BREAK_END: "13:00",
  LUNCH_BREAK_MINUTES: 120,

  // Thời gian từng ca làm việc
  MORNING_SHIFT: {
    START: "08:00",
    END: "11:00",
  },
  AFTERNOON_SHIFT: {
    START: "13:00",
    END: "18:00",
  },
  EMPLOYEE_DEFAULT: {
    START: "08:00",
    END: "18:00",
    EXPECTED_HOURS: 8,
  },

  // Loại ca làm việc (in hoa, dùng cho backend)
  SHIFT_TYPE: {
    MORNING: "MORNING",
    AFTERNOON: "AFTERNOON",
    FULL_DAY: "FULL_DAY",
  },
} as const;

// Xác định loại ca dựa vào giờ bắt đầu
export const determineShiftType = (startTime: string | null | undefined): string => {
  if (!startTime) {
    return WORK_HOURS_CONSTANTS.SHIFT_TYPE.FULL_DAY;
  }
  const parts = startTime.split(":");
  const hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1] || "0", 10);

  // Nếu trước 11:00 (hoặc đúng 11:00:00) -> ca sáng
  if (hour < 11 || (hour === 11 && minute === 0)) {
    return WORK_HOURS_CONSTANTS.SHIFT_TYPE.MORNING;
  }
  // Từ 11:00 đến trước 18:00 -> ca chiều
  if (hour < 18) {
    return WORK_HOURS_CONSTANTS.SHIFT_TYPE.AFTERNOON;
  }
  // Sau 18h hoặc không xác định thì coi là cả ngày
  return WORK_HOURS_CONSTANTS.SHIFT_TYPE.FULL_DAY;
};

// So sánh thời gian với loại ca làm việc truyền vào
export const matchesShiftType = (startTime: string | null | undefined, shiftType: string): boolean => {
  if (!startTime || !shiftType) {
    return false;
  }
  const determinedType = determineShiftType(startTime);
  if (shiftType === WORK_HOURS_CONSTANTS.SHIFT_TYPE.FULL_DAY) {
    return true; // FULL_DAY thì hợp với mọi khung giờ
  }
  return determinedType === shiftType;
};

// Danh sách các ca (cho legacy/hiện tại)
export const SHIFTS = [
  {
    id: "morning",
    name: "Morning",
    startTime: WORK_HOURS_CONSTANTS.MORNING_SHIFT.START,
    endTime: WORK_HOURS_CONSTANTS.MORNING_SHIFT.END,
  },
  {
    id: "afternoon",
    name: "Afternoon",
    startTime: WORK_HOURS_CONSTANTS.AFTERNOON_SHIFT.START,
    endTime: WORK_HOURS_CONSTANTS.AFTERNOON_SHIFT.END,
  },
] as const;

