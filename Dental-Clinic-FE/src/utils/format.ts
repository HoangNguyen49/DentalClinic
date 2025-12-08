//utils/format.ts
//huy_bro format json
export function formatVNDateTime(iso?: string | null): string {
  if (!iso) return "-";

  const d = new Date(iso);

  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");

  const dd = String(d.getDate()).padStart(2, "0");
  const mm2 = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  // đưa về đúng định dạng Việt Nam
  return `${hh}:${mm}  ${dd}/${mm2}/${yyyy}`;
}
export function formatMoney(
  amount?: number | null,
  currency?: string | null
): string {
  if (amount == null || Number.isNaN(amount)) return "-";

  const c = (currency || "VND").toUpperCase();

  if (c === "VND") {
    // cho tiền việt
    return `${amount.toLocaleString("vi-VN", {
      maximumFractionDigits: 0,
    })} đ`;
  }

  if (c === "USD") {
    // cho tiền đô
    return `$${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  // fmấy loại tiền khác
  return `${amount.toLocaleString("en-US")} ${c}`;
}