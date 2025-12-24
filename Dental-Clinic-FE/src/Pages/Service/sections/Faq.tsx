import { useTranslation } from "react-i18next";

function Faq() {
  const { t } = useTranslation("services");

  const faqs = t("faq.questions", { returnObjects: true }) as Array<{ q: string; a: string }>;

  return (
    <section aria-labelledby="faq" className="py-16">
      <div className="mx-auto max-w-5xl">
        <h2
          id="faq"
          className="text-center text-4xl md:text-5xl font-semibold tracking-tight text-black"
        >
          {t("faq.title")}
        </h2>

        <div className="mx-auto mt-8 divide-y divide-slate-200">
          {faqs.map((faq, index) => (
            <details key={index} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-black">
                <span className="text-xl font-semibold">{faq.q}</span>
                <span className="ml-4 text-black/50 transition group-open:rotate-180">
                  <svg viewBox="0 0 20 20" className="h-6 w-6" fill="currentColor" aria-hidden="true">
                    <path d="M5.5 7.5l4.5 4.5 4.5-4.5" />
                  </svg>
                </span>
              </summary>
              <div className="pb-5 text-lg leading-relaxed text-black">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Faq;
