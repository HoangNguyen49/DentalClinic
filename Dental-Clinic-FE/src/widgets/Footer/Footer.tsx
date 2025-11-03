import { Link } from "react-router-dom";
import toothlogo from "../../assets/images/tooth-logo.png";
import { FiInstagram, FiFacebook, FiLinkedin } from "react-icons/fi";
import { useTranslation } from "react-i18next";

function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-white py-12 font-instrument">
      <div className="max-w-7xl w-full mx-auto px-6 md:px-8 space-y-8">
        {/* Row 1 */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
          <p>📍 {t("footer.address")}</p>
          <div className="flex space-x-4 mt-4 md:mt-0 text-[#0F2154]">
            <a href="#" className="hover:text-[#3366FF] text-2xl"><FiInstagram /></a>
            <a href="#" className="hover:text-[#3366FF] text-2xl"><FiFacebook /></a>
            <a href="#" className="hover:text-[#3366FF] text-2xl"><FiLinkedin /></a>
          </div>
        </div>

        {/* Row 2 */}
        <div className="text-center">
          <h2 className="text-4xl md:text-8xl font-bold bg-[linear-gradient(90deg,#60ffd2,#3366ff_56%,#60ffd2)] bg-clip-text text-transparent pb-6">
            {t("footer.slogan")}
          </h2>
        </div>

        {/* Row 3 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:text-lg text-sm text-[#0F2154] font-bold">
          <div className="flex flex-col space-y-3">
            <Link to="/" className="hover:text-[#3366FF]">{t("nav.home")}</Link>
            <a href="#" className="hover:text-[#3366FF]">{t("footer.doctors")}</a>
            <a href="/service" className="hover:text-[#3366FF]">{t("nav.services")}</a>
            <a href="/contact" className="hover:text-[#3366FF]">{t("nav.contact")}</a>
            <a href="#" className="hover:text-[#3366FF]">{t("footer.license")}</a>
            <a href="/about" className="hover:text-[#3366FF]">{t("footer.about")}</a>
          </div>
          <div className="mt-6 md:mt-0 text-right flex flex-col items-end space-y-2">
            <div
              className="flex items-center justify-center rounded-full w-[90px] h-[90px] p-4 mb-2"
              style={{ background: "linear-gradient(180deg, #3366FF, #99BBFF)" }}
            >
              <img src={toothlogo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <p className="text-[#0D1B3E] font-semibold">{t("footer.workingHours.title")}</p>
            <p>{t("footer.workingHours.weekday")}</p>
            <p>{t("footer.workingHours.weekend")}</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t pt-4 text-center text-sm text-gray-500">
          <p>
            {t("footer.copyright")} © Hoang Nguyen sv FPT Aptech 2025 | {t("footer.poweredBy")}{" "}
            <a href="" target="_blank" rel="noopener noreferrer" className="text-[#3366FF] hover:underline">
              Hoang Nguyen
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
