const faqs = [
  { q: "What are your office hours?", a: "Mon-Fri 9:00–17:00. Saturday & Sunday day off." },
  { q: "Do you accept my insurance?", a: "Yes, we support major insurers and provide detailed invoices." },
  { q: "How often should I visit for a checkup?", a: "Every 6 months, or as your dentist advises." },
  { q: "What services do you offer?", a: "General dentistry, orthodontics, cosmetic procedures, and more." },
  { q: "Do you offer emergency dental care?", a: "Yes, we provide urgent care during office hours." },
  { q: "How can I schedule an appointment?", a: "Call us or use our online booking system on the website." },
];

function Faq() {
  return (
    <section aria-labelledby="faq" className="py-16">
      <div className="mx-auto max-w-5xl">
        <h2
          id="faq"
          className="text-center text-4xl md:text-5xl font-semibold tracking-tight text-black"
        >
          Frequently Asked Questions
        </h2>

        <div className="mx-auto mt-8 divide-y divide-slate-200">
          {faqs.map(({ q, a }) => (
            <details key={q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-black">
                <span className="text-xl font-semibold">{q}</span>
                <span className="ml-4 text-black/50 transition group-open:rotate-180">
                  <svg viewBox="0 0 20 20" className="h-6 w-6" fill="currentColor" aria-hidden="true">
                    <path d="M5.5 7.5l4.5 4.5 4.5-4.5" />
                  </svg>
                </span>
              </summary>
              <div className="pb-5 text-lg leading-relaxed text-black">
                {a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Faq;
