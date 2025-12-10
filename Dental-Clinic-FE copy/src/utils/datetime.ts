// Chuyển value từ <input type="datetime-local"> sang ISO string
export function localDatetimeToISO(localValue: string) {
  const parsed = new Date(localValue);
  if (isNaN(parsed.getTime())) {
    const [d, t] = localValue.split("T");
    const [y, m, dd] = (d || "").split("-").map(Number);
    const [hh, mm] = (t || "").split(":").map(Number);
    const safe = new Date(y, (m || 1) - 1, dd || 1, hh || 0, mm || 0, 0, 0);
    return safe.toISOString();
  }
  return parsed.toISOString();
}

// Default datetime-local string (ví dụ sau 30 phút từ now)
export function defaultLocalDatetimeValue(minutesFromNow = 30) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutesFromNow);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
