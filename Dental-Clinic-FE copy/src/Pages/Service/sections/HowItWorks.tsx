const steps = [
  {
    num: 1,
    title: "Examination",
    desc: "Comprehensive dental checkup & diagnosis",
  },
  {
    num: 2,
    title: "Treatment Plan",
    desc: "Personalized solutions and options",
  },
  {
    num: 3,
    title: "Follow-Up",
    desc: "Ongoing care, and monitoring of your oral health",
  },
];

function HowItWorks() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-5xl font-semibold tracking-tight text-black">
          How It Works
        </h2>

        <div className="relative mt-10">
          <div className="pointer-events-none absolute left-0 right-0 top-5 hidden h-px bg-slate-200 sm:block" />

          <div className="grid grid-cols-1 gap-10 pt-8 sm:grid-cols-3 text-center">
            {steps.map((s) => (
              <div key={s.num} className="flex flex-col items-center">
                <div className="relative z-10 mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white ring-8 ring-white">
                  <span className="text-lg font-semibold">{s.num}</span>
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
