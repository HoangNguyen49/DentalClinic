import { useTranslation } from "react-i18next";
import doc3 from "../../../assets/images/doctor.png"; 

type Props = {
  name?: string;
  title?: string;
  description?: string;
  photoSrc?: string;
  objectPosition?: string;
};

export default function FeaturedDoctor({
  name,
  title,
  description,
  photoSrc = doc3,
  objectPosition = "object-[50%_35%]",
}: Props) {
  const { t } = useTranslation("about");
  
  const defaultName = name || t("featuredDoctor.name");
  const defaultTitle = title || t("featuredDoctor.title");
  const defaultDescription = description || t("featuredDoctor.description");
  return (
    <section className="py-2">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-gradient-to-br from-[#f7f7f7] via-[#e6eaf2] to-[#cfe8ff] p-5 md:p-8 shadow-sm ring-1 ring-slate-200/60">
          <div className="flex items-center gap-5 md:gap-8">
            <div className="shrink-0">
              <img
                src={photoSrc}
                alt={defaultName}
                className={`h-20 w-20 md:h-60 md:w-60 rounded-full object-cover ${objectPosition} ring-2 ring-white shadow`}
                loading="lazy"
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-3xl md:text-4xl font-semibold text-black leading-tight">
                {defaultName}
              </h3>
              <p className="mt-1 text-lg md:text-xl text-slate-800">{defaultTitle}</p>
              <p className="mt-1 text-lg md:text-xl leading-snug text-slate-800">
                {defaultDescription}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
