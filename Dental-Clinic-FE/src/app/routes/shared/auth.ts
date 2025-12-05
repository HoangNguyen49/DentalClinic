export function getToken(): string | null {
  return localStorage.getItem("accessToken");
}

export function getUser(): any | null {
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export function getRoles(): string[] {
  const user = getUser();
  if (!user) return [];

  try {
    // Lấy roles từ user (có thể là user.roles hoặc user.role đơn lẻ)
    const rolesRaw = user.roles || user.role || [];

    // Đảm bảo luôn là mảng để dễ xử lý
    const rolesArray = Array.isArray(rolesRaw) ? rolesRaw : [rolesRaw];

    return rolesArray.map((r: any) => {
      // 1. Nếu là String ("ADMIN") -> Lấy luôn
      if (typeof r === 'string') {
        return r.replace(/^ROLE_/i, "").toUpperCase();
      }
      
      // 2. Nếu là Object ({ roleName: "ADMIN" } hoặc { authority: "ROLE_ADMIN" }) -> Trích xuất
      const roleString = r.roleName || r.name || r.authority || "";
      return roleString.toString().replace(/^ROLE_/i, "").toUpperCase();
    }).filter(Boolean); // Lọc bỏ các giá trị rỗng/null
  } catch (e) {
    console.error("Error parsing roles:", e);
    return [];
  }
}

export function hasRole(role: string): boolean {
  if (!role) return false;
  const currentRoles = getRoles();
  return currentRoles.includes(role.toUpperCase());
}

// Hàm helper kiểm tra có BẤT KỲ role nào trong danh sách không (Dùng cho ProtectedRoute)
export function hasAnyRole(roles: string[]): boolean {
  const currentRoles = getRoles();
  return roles.some(r => currentRoles.includes(r.toUpperCase()));
}