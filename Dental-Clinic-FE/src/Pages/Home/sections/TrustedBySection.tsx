import { useTranslation } from "react-i18next";

function TrustedBySection() {
  const { t } = useTranslation();
  const logoImports = import.meta.glob("../../../assets/images/slider-logo*.png", {
    eager: true,
  });
  const logos = Object.values(logoImports).map(
    (mod) => (mod as { default: string }).default
  );

  return (
    <section className="pt-4 md:pt-4 pb-12 md:pb-16 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto text-center px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-[#5e83cc] mb-12">
          {t("trustedBy.heading")}
        </h2>

        {/* Marquee container */}
        <div className="relative w-full overflow-hidden mt-4 md:mt-6">
          <div
            className="flex w-max animate-marquee gap-12"
            style={{ animation: "marquee 20s linear infinite" }}
          >
            {logos.concat(logos).map((logo, index) => (
              <img
                key={index}
                src={logo}
                alt={`Trusted Logo ${index + 1}`}
                className="h-20 object-contain grayscale-[0.75] hover:grayscale-0 transition"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TrustedBySection;
