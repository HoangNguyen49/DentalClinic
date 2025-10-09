import doctorImg from "../../../assets/images/doctor.png";
import { useTranslation } from "react-i18next";

function TeamSection() {
  const { t } = useTranslation();

  return (
    <section className="bg-white py-16 font-instrument">
      <div className="max-w-7xl w-full mx-auto px-6 md:px-8 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-[#0D1B3E] mb-12">
          {t("team.heading")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Left Card */}
          <div className="rounded-3xl bg-gradient-to-b from-[#e2e8eb] via-[#e9edf4] to-[#afd9f6] p-6 flex flex-col justify-between text-left h-full">
            <h3 className="text-xl font-bold text-[#0D1B3E] mb-4">{t("team.leftTitle")}</h3>
            <p className="text-gray-600 text-sm">{t("team.leftDescription")}</p>
          </div>

          {/* Center Doctor Image */}
          <div className="rounded-3xl overflow-hidden bg-gray-200 flex items-center justify-center relative">
            <img src={doctorImg} alt="Doctor" className="object-cover w-full h-full" />
          </div>

          {/* Right Info */}
          <div className="text-left flex flex-col justify-center h-full">
            <div>
              <h3 className="text-xl font-bold text-[#0D1B3E] mb-2">{t("team.doctorName")}</h3>
              <p className="text-gray-600 mb-4 text-sm">{t("team.doctorDescription")}</p>
              <div className="flex flex-wrap gap-8 text-sm mb-4">
                <div>
                  <span className="text-[#FF6600] font-semibold">{t("team.speciality")}:</span>
                  <span className="text-[#0D1B3E] ml-1">{t("team.specialityValue")}</span>
                </div>
                <div>
                  <span className="text-[#FF6600] font-semibold">{t("team.joinedSince")}:</span>
                  <span className="text-[#0D1B3E] ml-1">{t("team.joinedValue")}</span>
                </div>
              </div>
            </div>
            <button className="mt-6 bg-gradient-to-r from-[#66CCFF] to-[#3366FF] text-white font-bold px-6 py-2 rounded-full shadow border-2 border-white hover:scale-105 hover:shadow-lg transition-transform duration-300 w-max">
              {t("team.button")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TeamSection;
