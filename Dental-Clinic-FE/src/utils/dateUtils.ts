export const formatDateToLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getMondayOfWeek = (date: Date): string => {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    // Calculate offset to Monday: if Sunday (0), go back 6 days; otherwise go back (day - 1) days
    const offset = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + offset);

    // Use local time for formatting to avoid UTC shift
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
};

export const getNextMonday = (): string => {
    const today = new Date();
    const mondayOfCurrentWeekStr = getMondayOfWeek(today);

    // Add 'T00:00:00' to ensure we work with local time
    const nextMonday = new Date(mondayOfCurrentWeekStr + 'T00:00:00');
    nextMonday.setDate(nextMonday.getDate() + 7);

    // Use local time for formatting to avoid UTC shift
    const year = nextMonday.getFullYear();
    const month = String(nextMonday.getMonth() + 1).padStart(2, '0');
    const dayStr = String(nextMonday.getDate()).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
};

export const getDaysOfWeek = (weekStartDate: string, locale: string = "en-GB") => {
    // Parse the input date and ensure it's a Monday
    const inputDate = new Date(weekStartDate + 'T00:00:00');
    const dayOfWeek = inputDate.getDay();

    // If not Monday, adjust to the Monday of that week
    let monday = new Date(inputDate);
    if (dayOfWeek !== 1) {
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        monday.setDate(inputDate.getDate() + diff);
    }

    const days = [];
    // Generate exactly 6 days: Monday through Saturday
    for (let i = 0; i < 6; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);

        const dayNames = [
            "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
        ];
        const dayKey = [
            "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"
        ][date.getDay()];

        // Format date as YYYY-MM-DD for consistent parsing
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStringISO = `${year}-${month}-${day}`;

        days.push({
            key: dayKey,
            label: dayNames[date.getDay()],
            date: date,
            dayIndex: i,
            dateString: date.toLocaleDateString(locale, {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }),
            dateStringISO: dateStringISO, // ISO format for holiday checking
        });
    }
    return days;
};

/**
 * Format date string to localized date format
 * @param dateString - ISO date string
 * @param locale - Locale string (default: "vi-VN")
 * @returns Formatted date string (DD/MM/YYYY)
 */
export const formatDate = (dateString: string, locale: string = "vi-VN"): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
};

/**
 * Format date string to localized date-time format
 * @param dateString - ISO date string
 * @param locale - Locale string (default: "vi-VN")
 * @returns Formatted date-time string (DD/MM/YYYY HH:MM)
 */
export const formatDateTime = (dateString: string, locale: string = "vi-VN"): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString(locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const formatDateWithWeekday = (dateString: string, locale: string = "vi-VN"): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, {
        weekday: "long",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
};


export const formatRelativeTime = (dateString: string, locale: string = "vi-VN"): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 7) {
        return formatDate(dateString, locale);
    } else if (diffInDays > 0) {
        return `${diffInDays} ${locale === "vi-VN" ? "ngày trước" : "days ago"}`;
    } else if (diffInHours > 0) {
        return `${diffInHours} ${locale === "vi-VN" ? "giờ trước" : "hours ago"}`;
    } else if (diffInMinutes > 0) {
        return `${diffInMinutes} ${locale === "vi-VN" ? "phút trước" : "minutes ago"}`;
    } else {
        return locale === "vi-VN" ? "Vừa xong" : "Just now";
    }
};
