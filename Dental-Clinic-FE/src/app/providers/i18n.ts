import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import resourcesToBackend from "i18next-resources-to-backend";


export const APP_NAMESPACES = ["web", "home", "services", "about", "contact", "admin"] as const;

i18n
  .use(initReactI18next)
  .use(
    
    resourcesToBackend((lng: string, ns: string) => {
      return import(`../../locales/${lng}/${ns}.json`);
    })
  )
  .init({
    // 🔹 Lấy ngôn ngữ đang lưu trong localStorage, mặc định 'en'
    lng: localStorage.getItem("lang") || "en",
    fallbackLng: "en",

    // 🔹 Khai báo các namespace
    ns: APP_NAMESPACES as unknown as string[],
    defaultNS: "web",

    interpolation: {
      escapeValue: false, // React đã xử lý XSS rồi
    },
  });

export default i18n;
