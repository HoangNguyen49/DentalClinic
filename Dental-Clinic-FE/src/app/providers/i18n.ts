import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import resourcesToBackend from "i18next-resources-to-backend";


export const APP_NAMESPACES = ["web", "home", "services", "about", "contact", "admin", "login","signup", "attendance", "hr-dashboard", "employees", "schedules"] as const;

i18n
  .use(initReactI18next)
  .use(
    
    resourcesToBackend((lng: string, ns: string) => {
      return import(`../../locales/${lng}/${ns}.json`);
    })
  )
  .init({
    
    lng: localStorage.getItem("lang") || "en",
    fallbackLng: "en",

 
    ns: APP_NAMESPACES as unknown as string[],
    defaultNS: "web",

    interpolation: {
      escapeValue: false, 
    },
  });

export default i18n;
