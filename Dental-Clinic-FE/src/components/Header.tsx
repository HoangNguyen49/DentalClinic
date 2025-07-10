import { Link } from "react-router-dom";
import logo from "../assets/images/logo.png";

function Header() {
  return (
    <header className="bg-white shadow sticky top-0 z-50 font-instrument text-base">
      <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6">
        {/* Logo */}
        <img src={logo} alt="Logo" className="h-20 w-auto" />

        {/* Navbar */}
        <nav className="hidden md:flex space-x-8 text-primary font-bold">
          <a href="#" className="hover:text-blue-600">Home</a>
          <a href="#" className="hover:text-blue-600">Services</a>
          <a href="#" className="hover:text-blue-600">About</a>
          <a href="#" className="hover:text-blue-600">Contact</a>
        </nav>

        {/* CTA */}
        <div className="flex items-center">
          {/* Login Button */}
          <Link to="/login">
            <button className="
              mr-3
              px-5 py-2
              rounded-full
              border-2 border-[#3366FF]
              text-[#3366FF]
              font-bold
              transition
              hover:bg-[#3366FF] hover:text-white
            ">
              Login
            </button>
          </Link>

          {/* Get In Touch Button */}
          <button className="
            group relative inline-flex
            h-[56px] items-center justify-center
            rounded-full
            bg-gradient-to-r from-[#AACCFF] via-[#6699FF] to-[#3366FF]
            px-6
            font-bold text-white
            transition-all duration-300 ease-in-out
            overflow-hidden
          ">
            {/* Hover Fill Layer */}
            <div className="
              absolute right-0 top-0 h-full w-0
              bg-[#6699FF] opacity-0
              transition-all duration-500 ease-in-out
              group-hover:w-full group-hover:opacity-80
            "></div>

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
