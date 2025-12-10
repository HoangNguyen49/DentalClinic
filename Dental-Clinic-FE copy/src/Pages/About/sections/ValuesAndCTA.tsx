import React from "react";
import { UserRound, Heart, Shield } from "lucide-react";
import { Link } from "react-router-dom";

function ValueItem(props: { icon: React.ReactNode; label: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-3 inline-flex items-center justify-center rounded-full bg-blue-100 p-2">
        <div className="inline-flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
          {React.isValidElement(props.icon)
            ? React.cloneElement(props.icon as any, { className: "h-9 w-9 md:h-10 md:w-10" })
            : props.icon}
        </div>
      </div>
      <div className="text-xl md:text-2xl font-medium text-black leading-tight">
        {props.label}
      </div>
    </div>
  );
}

export default function ValuesAndCTA() {
  return (
    <section className="py-8">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-white p-8 md:p-10 text-center shadow-sm ring-1 ring-slate-200">
          <h3 className="text-3xl md:text-4xl font-semibold text-black">Our Values</h3>

          <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-3">
            <ValueItem
              icon={<UserRound strokeWidth={2} />}
              label={
                <span>
                  Personalized
                  <br /> Approach
                </span>
              }
            />
            <ValueItem icon={<Heart strokeWidth={2} />} label="Compassion" />
            <ValueItem icon={<Shield strokeWidth={2} />} label="Transparency" />
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Link
            to="/service"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-10 md:px-14 py-4 text-white text-base md:text-lg font-semibold tracking-wide uppercase shadow-md transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-95"

          >
            See Our Services
          </Link>
        </div>
      </div>
    </section>
  );
}
