//helper dùng chung để đọc roles/token từ localStorage

export function getToken(): string | null {
  return localStorage.getItem("accessToken");
}

export function getRoles(): string[] {
  try {
    const roles = JSON.parse(localStorage.getItem("roles") || "[]") as string[];
    return roles.map(r => r?.toString().replace(/^ROLE_/i, "").toUpperCase());
  } catch {
    return [];
  }
}

export function hasRole(role: string): boolean {
  return getRoles().includes(role.toUpperCase());
}
