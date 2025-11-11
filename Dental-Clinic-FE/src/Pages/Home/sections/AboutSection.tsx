import toothlogo from "../../../assets/images/tooth-logo.png";
import { useTranslation } from "react-i18next";

function AboutSection() {
  const { t } = useTranslation(["home","web"]);

  return (
    <section className="bg-white py-16 font-instrument">
      <div className="max-w-7xl w-full mx-auto px-4 md:px-8 text-center">
        <div className="flex justify-center mb-8">
          <div className="flex items-center justify-center rounded-full w-[90px] h-[90px] p-4"
               style={{ background: "linear-gradient(180deg, #3366FF, #99BBFF)" }}>
            <img src={toothlogo} alt="Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        <h2 className="text-3xl md:text-5xl font-semibold text-[#0D1B3E] leading-relaxed md:leading-loose max-w-5xl mx-auto text-center">
          {t("home:aboutSection.heading.part1")}&nbsp;
          <span className="bg-gradient-to-r from-[#6699FF] to-[#33CCFF] bg-clip-text text-transparent">
            {t("home:aboutSection.heading.part2")}
          </span>&nbsp;
          {t("home:aboutSection.heading.part3")}&nbsp;
          <span className="bg-gradient-to-r from-[#6699FF] to-[#33CCFF] bg-clip-text text-transparent">
            {t("home:aboutSection.heading.part4")}
          </span>
        </h2>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-8xl mx-auto border-t border-b py-8">
          <div>
            <p className="text-4xl font-bold text-[#0D1B3E]">23</p>
            <p className="text-gray-500">{t("home:aboutSection.stats.years")}</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-[#0D1B3E]">348</p>
            <p className="text-gray-500">{t("home:aboutSection.stats.employees")}</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-[#0D1B3E]">11</p>
            <p className="text-gray-500">{t("home:aboutSection.stats.branches")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
