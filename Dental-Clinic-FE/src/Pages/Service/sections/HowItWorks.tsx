import { useTranslation } from "react-i18next";

function HowItWorks() {
  const { t } = useTranslation("services");

  const steps = t("howItWorks.steps", { returnObjects: true }) as Array<{ title: string; desc: string }>;

  return (
    <section className="py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-5xl font-semibold tracking-tight text-black">
          {t("howItWorks.title")}
        </h2>

        <div className="relative mt-10">
          <div className="pointer-events-none absolute left-0 right-0 top-5 hidden h-px bg-slate-200 sm:block" />

          <div className="grid grid-cols-1 gap-10 pt-8 sm:grid-cols-3 text-center">
            {steps.map((s, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="relative z-10 mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white ring-8 ring-white">
                  <span className="text-lg font-semibold">{index + 1}</span>
                </div>
                <h3 className="text-2xl font-semibold text-black">{s.title}</h3>
                <p className="mt-2 text-lg leading-relaxed text-slate-600">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
