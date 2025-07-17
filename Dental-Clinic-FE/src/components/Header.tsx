import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/images/logo.png";
import { useEffect, useState } from "react";

function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const avatarSrc =
  user?.avatarUrl && user.avatarUrl.trim() !== ""
    ? user.avatarUrl
    : `${import.meta.env.VITE_API_URL}/uploads/default-avatar.png`;


  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const isAdmin = user?.role === "admin";

  // Đóng dropdown nếu click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("#user-dropdown")) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
            Home
          </Link>
          <a href="#" className="hover:text-blue-600">
            Services
          </a>
          <a href="#" className="hover:text-blue-600">
            About
          </a>
          <a href="#" className="hover:text-blue-600">
            Contact
          </a>
        </nav>

        {/* CTA */}
        <div className="flex items-center space-x-4 relative">
          {!user ? (
            <Link to="/login">
              <button className="px-5 py-2 rounded-full border-2 border-[#3366FF] text-[#3366FF] font-bold transition hover:bg-[#3366FF] hover:text-white">
                Login
              </button>
            </Link>
          ) : (
            <div className="relative" id="user-dropdown">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="focus:outline-none"
              >
                {user.avatarUrl ? (
                  <img
                    src={avatarSrc}
                    alt="Avatar"
                    className="w-14 h-14 rounded-full border-2 border-[#3366FF] object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-300 flex items-center justify-center text-[#3366FF] font-bold text-lg">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5 transition-all duration-200 z-50">
                  <Link
                    to="/my-account"
                    className="block px-5 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#3366FF] transition"
                  >
                    My Account
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin-dashboard"
                      className="block px-5 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#3366FF] transition"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#EF4444] transition"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Get In Touch Button */}
          <button className="group relative inline-flex h-[56px] items-center justify-center rounded-full bg-gradient-to-r from-[#AACCFF] via-[#6699FF] to-[#3366FF] px-6 font-bold text-white transition-all duration-300 ease-in-out overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-0 bg-[#6699FF] opacity-0 transition-all duration-500 ease-in-out group-hover:w-full group-hover:opacity-80" />
            <span className="relative z-10 flex items-center gap-2">
              GET IN TOUCH
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
