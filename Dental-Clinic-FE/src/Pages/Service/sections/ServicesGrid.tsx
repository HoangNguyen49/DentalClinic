import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import preventiveCareImg from "../../../assets/service_images/preventive-care.png";
import dentalImplantImg from "../../../assets/service_images/dental-implant.jpg";
import orthImg from "../../../assets/service_images/orthodontics.png";
import dentistryImg from "../../../assets/service_images/dentistry.png";
import surgeryImg from "../../../assets/service_images/surgery.png";
import kidCareImg from "../../../assets/service_images/kid-care.png";

function Card(props: {iconSrc?: string; title: string; desc: string; bookNowText: string }) {
  return (
    <Link to="/booking" className="block">
      <div className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition cursor-pointer group">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50">
          {props.iconSrc ? (
            <img
              src={props.iconSrc}
              alt={props.title}
              className="h-full w-full object-contain origin-center scale-[1.6]"
              loading="lazy"
            />
          ) : (
            <span className="block h-6 w-6 rounded-lg bg-white/60" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#3366FF] transition">{props.title}</h3>
          <p className="mt-1 text-sm text-gray-600 leading-snug">{props.desc}</p>
          <div className="mt-3">
            <span className="text-sm font-medium text-[#3366FF] group-hover:underline">
              {props.bookNowText} →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ServicesGrid() {
  const { t } = useTranslation("services");

  const services = [
    {
      key: "preventiveCare",
      iconSrc: preventiveCareImg,
    },
    {
      key: "dentalImplants",
      iconSrc: dentalImplantImg,
    },
    {
      key: "orthodontics",
      iconSrc: orthImg,
    },
    {
      key: "cosmeticDentistry",
      iconSrc: dentistryImg,
    },
    {
      key: "oralSurgery",
      iconSrc: surgeryImg,
    },
    {
      key: "pediatricDentistry",
      iconSrc: kidCareImg,
    },
  ];

  return (
    <section className="py-14 bg-gray-50">
      <h2 className="text-center text-5xl font-semibold text-gray-900">
        {t("title")}
      </h2>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 max-w-5xl mx-auto px-6">
        {services.map((service) => (
          <Card
            key={service.key}
            iconSrc={service.iconSrc}
            title={t(`services.${service.key}.title`)}
            desc={t(`services.${service.key}.desc`)}
            bookNowText={t("bookNow")}
          />
        ))}
      </div>
    </section>
  );
}

export default ServicesGrid;
