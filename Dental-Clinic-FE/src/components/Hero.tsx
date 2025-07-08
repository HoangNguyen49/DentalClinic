import toothImage from "../assets/images/hero-tooth.png";
import avatarLeft from "../assets/images/avatar-left.png";
import avatarRight from "../assets/images/avatar-right.png";
import {
  SparklesIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/solid";

function Hero() {
  return (
    <section className="pt-24 pb-16 px-0">
      <div
        className="
      max-w-7xl mx-auto
      px-6
      border-1 border-[#D1E3FF]
      rounded-[80px]
      py-6 md:py-10
      bg-gradient-to-b from-[#f7f7f7] via-[#e6eaf2] to-[#afd9f6]
      relative
    "
      >
        {/* H1 */}
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center mb-12">
          <h1
            className="text-[48px] md:text-[72px] font-bold bg-clip-text text-transparent leading-[1.2] tracking-[-0.02em] max-w-3xl pb-2"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #60ffd2, #3366ff 56%, #60ffd2)",
            }}
          >
            Gorgeous Smile for a Brighter Life
          </h1>
        </div>

        {/* Grid: Avatar - Button - Avatar */}
        <div className="max-w-6xl mx-auto grid grid-cols-3 items-center mb-12">
          {/* Avatar Left */}
          <div className="hidden md:flex flex-col items-center space-y-2">
            <img
              src={avatarLeft}
              alt="Doctor Left"
              className="w-35 h-28 rounded-2xl shadow"
            />
            <p className="text-base md:text-lg text-center">
              Hi, Welcome to <br />
              <span className="text-[#3366FF] font-bold">Confident</span>
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <button
              className="
                group relative inline-flex
                h-[48px] items-center justify-center
                rounded-full
                bg-gradient-to-r from-[#AACCFF] via-[#6699FF] to-[#3366FF]
                px-6
                font-bold text-white
                transition-all duration-300 ease-in-out
                overflow-hidden
              "
            >
              {/* Hover Fill Layer */}
              <div
                className="
                  absolute right-0 top-0 h-full w-0
                  bg-[#6699FF] opacity-0
                  transition-all duration-500 ease-in-out
                  group-hover:w-full group-hover:opacity-80
                "
              ></div>

              <span className="relative z-10 flex items-center gap-2">
                SEE OUR DOCTOR
              </span>
            </button>
          </div>

          {/* Avatar Right */}
          <div className="hidden md:flex flex-col items-center space-y-2">
            <img
              src={avatarRight}
              alt="Doctor Right"
              className="w-35 h-28 rounded-2xl shadow"
            />
            <p className="text-base md:text-lg text-center">
              Professionalism & Attention <br />
              Since 2001
            </p>
          </div>
        </div>

        {/* Center Tooth Image with Floating Tags */}
        <div className="flex justify-center mt-8">
          <div className="relative">
            <img
              src={toothImage}
              alt="Tooth"
              className="w-[300px] md:w-[500px] drop-shadow-lg"
            />

            {/* Floating Tags */}
            {/* Tag 1: Top Left */}
            <div className="absolute top-[20%] left-0 md:-left-10">
              <span
                className="
                  flex items-center gap-1
                  bg-white text-[#3366FF] rounded-full
                  px-3 py-1
                  text-xs md:text-sm
                  shadow border border-blue-100
                "
              >
                <ShieldCheckIcon className="w-4 h-4 md:w-5 md:h-5" />
                Preventive Care
              </span>
            </div>

            {/* Tag 2: Bottom Right */}
            <div className="absolute bottom-[20%] right-0 md:-right-10">
              <span
                className="
                  flex items-center gap-1
                  bg-white text-[#3366FF] rounded-full
                  px-3 py-1
                  text-xs md:text-sm
                  shadow border border-blue-100
                "
              >
                <SparklesIcon className="w-4 h-4 md:w-5 md:h-5" />
                Modern Dentistry
              </span>
            </div>

            {/* Tag 3: Top Right */}
            <div className="absolute top-[20%] right-0 md:-right-10">
              <span
                className="
                  flex items-center gap-1
                  bg-white text-[#3366FF] rounded-full
                  px-3 py-1
                  text-xs md:text-sm
                  shadow border border-blue-100
                "
              >
                <Cog6ToothIcon className="w-4 h-4 md:w-5 md:h-5" />
                Advanced Equipment
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
