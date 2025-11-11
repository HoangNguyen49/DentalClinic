import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import { useEffect, useState } from "react";
import i18n from "../../app/providers/i18n";
import axios from "axios";
import { useTranslation } from "react-i18next";

function Header() {
  const navigate = useNavigate();
  const { t } = useTranslation(["web"]);
  const [user, setUser] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const DEFAULT_AVATAR =
    import.meta.env.VITE_DEFAULT_AVATAR_URL ||
    "https://res.cloudinary.com/dchzko3lj/image/upload/v1762616672/default-avatar_brvdfn.png";

  const avatarSrc =
    user?.avatarUrl && user.avatarUrl.trim() !== ""
      ? user.avatarUrl
      : DEFAULT_AVATAR;

  // đọc user từ localStorage
  const loadUserFromStorage = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    else setUser(null);
  };

  useEffect(() => {
    loadUserFromStorage();

    // Cập nhật khi chuyển tab quay lại hoặc khi app lấy lại focus
    const onFocus = () => loadUserFromStorage();
    window.addEventListener("focus", onFocus);

    // Cập nhật lại trang khi User upload avatar
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    
    const handleAvatarUpdate = () => {
    const updatedUser = localStorage.getItem("user");
    if (updatedUser) setUser(JSON.parse(updatedUser));
    };

    // Đồng bộ khi localStorage thay đổi (khác tab)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "user") loadUserFromStorage();
    };
    window.addEventListener("storage", onStorage);

    // Đóng dropdown khi click ra ngoài
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("#user-dropdown")) setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.addEventListener("avatarUpdated", handleAvatarUpdate);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    setUser(null);
    navigate("/login");
  };

  // check role ADMIN
  const isAdmin = Array.isArray(user?.roles)
    ? user.roles.includes("ADMIN")
    : user?.role === "ADMIN";

  const changeLang = async () => {
    const newLang = i18n.language === "en" ? "vi" : "en";
    await axios.get(`${import.meta.env.VITE_API_URL}/locale?lang=${newLang}`, {
      withCredentials: true,
    });
    await i18n.changeLanguage(newLang);
    localStorage.setItem("lang", newLang);
  };

  return (
    <header className="bg-white shadow sticky top-0 z-50 font-instrument text-base">
      <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6">
        {/* Logo */}
        <Link to="/">
          <img src={logo} alt="Logo" className="h-20 w-auto cursor-pointer" />
        </Link>

        {/* Navbar */}
        <nav className="hidden md:flex space-x-8 text-primary font-bold">
          <Link to="/" className="hover:text-blue-600">
            {t("nav.home")}
          </Link>
          <Link to="/service" className="hover:text-blue-600">
            {t("nav.services")}
          </Link>
          <Link to="/about" className="hover:text-blue-600">
            {t("nav.about")}
          </Link>
          <Link to="/contact" className="hover:text-blue-600">
            {t("nav.contact")}
          </Link>
        </nav>

        {/* CTA */}
        <div className="flex items-center space-x-4 relative">
          {/* Language switcher */}
          <button
            onClick={changeLang}
            className="px-4 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-[#AACCFF] via-[#6699FF] to-[#3366FF] text-white shadow-md transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-lg flex items-center gap-2"
          >
            {i18n.language === "en" ? <span>VN</span> : <span>EN</span>}
          </button>

          {!user ? (
            <Link to="/login">
              <button className="px-5 py-2 rounded-full border-2 border-[#3366FF] text-[#3366FF] font-bold transition hover:bg-[#3366FF] hover:text-white">
                {t("auth.login")}
              </button>
            </Link>
          ) : (
            <div className="relative" id="user-dropdown">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="focus:outline-none"
              >
                <img
                  src={avatarSrc}
                  alt="Avatar"
                  className="w-14 h-14 rounded-full border-2 border-[#3366FF] object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
                  }}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5 transition-all duration-200 z-50">
                  <Link
                    to="/my-account"
                    className="block px-5 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#3366FF] transition"
                  >
                    {t("account.myAccount")}
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin/dashboard"
                      className="block px-5 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#3366FF] transition"
                    >
                      {t("account.adminDashboard")}
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#EF4444] transition"
                  >
                    {t("auth.logout")}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Get In Touch Button */}
          <button className="group relative inline-flex h-[56px] items-center justify-center rounded-full bg-gradient-to-r from-[#AACCFF] via-[#6699FF] to-[#3366FF] px-6 font-bold text-white transition-all duration-300 ease-in-out overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-0 bg-[#6699FF] opacity-0 transition-all duration-500 ease-in-out group-hover:w-full group-hover:opacity-80" />
            <span className="relative z-10 flex items-center gap-2">
              {t("cta.getInTouch")}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 md:h-6 md:w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
