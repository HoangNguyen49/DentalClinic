import doc1 from "../../../assets/about_images/doctor1.png";
import doc2 from "../../../assets/about_images/doctor2.png";
import doc3 from "../../../assets/about_images/doctor3.png";
import doc4 from "../../../assets/about_images/doctor4.png";

type Doc = { src: string; alt: string };
const doctors: Doc[] = [
  { src: doc1, alt: "Doctor 1" },
  { src: doc2, alt: "Doctor 2" },
  { src: doc3, alt: "Doctor 3" },
  { src: doc4, alt: "Doctor 4" },
];

export default function AboutUsTop() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {doctors.map((d) => (
            <figure
              key={d.alt}
              className="overflow-hidden rounded-3xl ring-1 ring-slate-200 bg-white shadow-sm"
            >
              
              <img
                src={d.src}
                alt={d.alt}
                className="aspect-[4/5] w-full object-cover object-[50%_35%] rounded-3xl"
                loading="lazy"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
