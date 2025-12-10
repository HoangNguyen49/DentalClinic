import { CheckCircleIcon } from "@heroicons/react/24/solid";

const bullets = [
  "Strict hygiene and sterilization protocols",
  "Experienced and caring dentists",
  "State-of-the-art dental technology",
  "Long-lasting and predictable results",
];

function Badge() {
  return (
    <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-200">
      <CheckCircleIcon className="h-5 w-5 text-blue-600" />
    </span>
  );
}

function WhyChooseUs() {
  return (
    <section aria-labelledby="why-choose-us" className="py-16">
      <div className="mx-auto max-w-5xl">
        <h2
          id="why-choose-us"
          className="text-center text-4xl md:text-5xl font-semibold tracking-tight text-black"
        >
          Why Choose Us
        </h2>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-28 px-6 md:px-[88px]">
          {bullets.map((b) => (
            <div key={b} className="flex items-start text-black">
              <Badge />
              <span className="text-lg leading-relaxed">{b}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


export default WhyChooseUs;
