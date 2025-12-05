export const getMondayOfWeek = (date: Date): string => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split("T")[0];
};

export const getNextMonday = (): string => {
    const today = new Date();
    const mondayOfCurrentWeek = getMondayOfWeek(today);
    const nextMonday = new Date(mondayOfCurrentWeek);
    nextMonday.setDate(nextMonday.getDate() + 7);
    return nextMonday.toISOString().split("T")[0];
};

export const getDaysOfWeek = (weekStartDate: string, locale: string = "en-GB") => {
    const monday = new Date(weekStartDate);
    const days = [];
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
