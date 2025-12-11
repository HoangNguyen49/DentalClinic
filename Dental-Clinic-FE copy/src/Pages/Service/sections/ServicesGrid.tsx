import preventiveCareImg from "../../../assets/service_images/preventive-care.png";
import dentalImplantImg from "../../../assets/service_images/dental-implant.jpg";
import orthImg from "../../../assets/service_images/orthodontics.png";
import dentistryImg from "../../../assets/service_images/dentistry.png";
import surgeryImg from "../../../assets/service_images/surgery.png";
import kidCareImg from "../../../assets/service_images/kid-care.png";

function Card(props: {iconSrc?: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition">
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
        <h3 className="text-lg font-semibold text-gray-900">{props.title}</h3>
        <p className="mt-1 text-sm text-gray-600 leading-snug">{props.desc}</p>
      </div>
    </div>
  );
}

const services = [
  {
    title: "Preventive Care",
    desc: "Regular exams, cleanings, and x rays to maintain optimal oral health",
    iconSrc: preventiveCareImg,
  },
  {
    title: "Dental Implants",
    desc: "Permanent solution for missing teeth with natural look & bite",
    iconSrc: dentalImplantImg,
  },
  {
    title: "Orthodontics",
    desc: "Teeth straightening with braces and aligners for a healthier smile",
    iconSrc: orthImg,
  },
  {
    title: "Cosmetic Dentistry",
    desc: "Veneers, crowns, whitening for a brighter, balanced smile",
    iconSrc:dentistryImg,
  },
  {
    title: "Oral Surgery",
    desc: "Extractions, wisdom tooth removal, and other surgical procedures",
    iconSrc: surgeryImg,
  },
  {
    title: "Pediatric Dentistry",
    desc: "Dental care for children in a friendly, comfortable environment",
    iconSrc: kidCareImg,
  },
];

function ServicesGrid() {
  return (
    <section className="py-14 bg-gray-50">
      <h2 className="text-center text-5xl font-semibold text-gray-900">
        Our Services
      </h2>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 max-w-5xl mx-auto">
        {services.map((service) => (
          <Card
            key={service.title}
            iconSrc={service.iconSrc}
            title={service.title}
            desc={service.desc}
          />
        ))}
      </div>
    </section>
  );
}

export default ServicesGrid;
