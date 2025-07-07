import logo from '../assets/images/logo.png';

function Header() {
  return (
    <header className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6">
        {/* Logo */}
        <img src={logo} alt="Logo" className="h-24 w-auto" />

        {/* Navbar */}
        <nav className="hidden md:flex space-x-8">
          <a href="#" className="text-gray-700 hover:text-blue-600">Home</a>
          <a href="#" className="text-gray-700 hover:text-blue-600">Services</a>
          <a href="#" className="text-gray-700 hover:text-blue-600">About</a>
          <a href="#" className="text-gray-700 hover:text-blue-600">Contact</a>
        </nav>

        {/* CTA */}
        <button className="ml-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          Book Appointment
        </button>
      </div>
    </header>
  );
}

export default Header;
