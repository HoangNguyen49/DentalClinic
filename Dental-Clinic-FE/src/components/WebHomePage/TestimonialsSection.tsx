import { useState } from "react";
import patient1 from "../../assets/images/patient1.png";
import patient2 from "../../assets/images/patient2.png";
import patient3 from "../../assets/images/patient3.png";

const feedbacks = [
  {
    image: patient1,
    quote: "Dr. Huston is the best! The office is clean, the staff is kind, and my appointment was quick and stress-free. I’ll definitely be back!",
    name: "Liam Elias",
    detail: "Routine check-ups and cleanings"
  },
  {
    image: patient2,
    quote: "Amazing experience! The team at Confident is friendly, and Dr. Olivia made sure I felt comfortable throughout my treatment. I’m very happy with the results.",
    name: "Catherine Reiss",
    detail: "Routine check-ups and cleanings"
  },
  {
    image: patient3,
    quote: "I had a great experience with Dr. Peter and the team. They were kind, professional, and made my visit as comfortable as possible. Highly recommend!",
    name: "Jason Mcarter",
    detail: "Routine check-ups and cleanings"
  }
];

function TestimonialsSection() {
  const [index, setIndex] = useState(0);
  const current = feedbacks[index];

  return (
    <section className="bg-white py-16 font-instrument">
      <div className="max-w-7xl w-full mx-auto px-4 md:px-8 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-[#0D1B3E] mb-12">
          1500+ Confident Patients Worldwide
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="relative flex justify-start md:pl-15">
            <img src={current.image} alt={current.name} className="rounded-3xl w-72 h-auto object-cover shadow-lg" />
          </div>
          <div className="text-left">
            <p className="text-gray-600 text-lg italic mb-6">“{current.quote}”</p>
            <hr className="my-4" />
            <div className="flex justify-between items-center">
              <div></div>
              <div className="text-right">
                <p className="text-[#3366FF] font-semibold">{current.name}</p>
                <p className="text-gray-500 text-sm">{current.detail}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 flex justify-center gap-3">
          {feedbacks.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-transform duration-300 ${index === i ? "bg-gradient-to-r from-[#66CCFF] to-[#3366FF] text-white scale-105 shadow-md" : "bg-gray-200 hover:bg-gray-300"}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
