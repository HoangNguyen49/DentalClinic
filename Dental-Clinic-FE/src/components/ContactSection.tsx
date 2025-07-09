
import toothImage from "../assets/images/contact-tooth.png";

function ContactSection() {
  return (
    <section className="bg-white py-16 font-instrument">
      <div className="max-w-7xl w-full mx-auto px-6 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start md:items-center">
        {/* Left side image and title */}
        <div className="flex flex-col items-center justify-center text-center md:text-left mt-8 md:mt-12">
          <h2 className="text-3xl md:text-5xl font-semibold text-[#0D1B3E] mb-8">Let’s Get in Touch With Us</h2>
          <img src={toothImage} alt="Tooth" className="w-80 h-auto" />
        </div>

        {/* Right side form */}
        <div className="bg-gradient-to-br from-[#E6F0FF] to-[#F6FAFF] p-8 rounded-3xl shadow-md w-full">
          <form className="flex flex-col space-y-4">
            <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
              <input type="text" placeholder="Name" className="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3366FF]" />
              <input type="email" placeholder="Email" className="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3366FF]" />
            </div>
            <input type="text" placeholder="Subject" className="px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3366FF]" />
            <textarea placeholder="Messages" rows={4} className="px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3366FF] resize-none"></textarea>
            <button type="submit" className="mt-4 bg-gradient-to-r from-[#66CCFF] to-[#3366FF] text-white font-bold px-6 py-3 rounded-full shadow-lg transform transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-2xl w-full md:w-auto">
              SEND MESSAGES
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default ContactSection;
