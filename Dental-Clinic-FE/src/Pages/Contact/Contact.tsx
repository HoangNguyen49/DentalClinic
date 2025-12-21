import React from "react";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

function InfoCard(props: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      <div className="mb-4 text-blue-600">
        {React.isValidElement(props.icon)
          ? React.cloneElement(props.icon as any, { className: "h-12 w-12" })
          : props.icon}
      </div>
      <h3 className="text-xl md:text-2xl font-semibold text-black">{props.title}</h3>
      <p className="mt-2 text-base md:text-lg text-slate-700">{props.desc}</p>
    </div>
  );
}


export default function ContactPage() {
  const { t } = useTranslation("contact");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
  }

  return (
    <main className="py-16">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-b from-[#f7f7f7] via-[#e6eaf2] to-[#afd9f6] px-6 py-12 md:px-10 shadow-sm">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-center text-4xl md:text-5xl font-semibold tracking-tight text-black">
          {t("title")}
        </h1>
        <p className="mt-3 text-center text-slate-600">{t("subtitle")}</p>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <InfoCard 
            icon={<Phone strokeWidth={2} />} 
            title={t("info.callUs.title")} 
            desc={t("info.callUs.desc")} 
          />
          <InfoCard 
            icon={<Mail strokeWidth={2} />} 
            title={t("info.emailUs.title")} 
            desc={t("info.emailUs.desc")} 
          />
          <InfoCard 
            icon={<MapPin strokeWidth={2} />} 
            title={t("info.location.title")} 
            desc={t("info.location.desc")} 
          />
          <InfoCard 
            icon={<Clock strokeWidth={2} />} 
            title={t("info.officeHours.title")} 
            desc={t("info.officeHours.desc")} 
          />
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="text"
              name="name"
              placeholder={t("form.name.placeholder")}
              required
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              name="email"
              placeholder={t("form.email.placeholder")}
              required
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <textarea
            name="message"
            placeholder={t("form.message.placeholder")}
            rows={5}
            required
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-center gap-4 flex-wrap">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-white font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {t("form.submit")}
            </button>
            <Link
              to="/booking"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#3366FF] to-[#6699FF] px-6 py-3 text-white font-medium shadow-sm hover:from-[#2255DD] hover:to-[#5588EE] focus:outline-none focus:ring-2 focus:ring-[#3366FF] transition"
            >
              {t("cta.bookAppointment")}
            </Link>
          </div>
        </form>
      </div>
      </div>
    </main>
  );
}
