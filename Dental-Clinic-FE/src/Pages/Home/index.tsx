import Header from "../../widgets/Header/Header";
import Hero from "./sections/Hero";
import AboutSection from "./sections/AboutSection";
import TrustedBySection from "./sections/TrustedBySection";
import TeamSection from "./sections/TeamSection";
import TestimonialsSection from "./sections/TestimonialsSection";
import ContactSection from "./sections/ContactSection";
import Footer from "../../widgets/Footer/Footer";
import AIChatWidget from "../../widgets/AIChatWidget/AIChatWidget";

function HomePage() {
  return (
    <>
      <Header />
      <Hero />
      <AboutSection />
      <TrustedBySection />
      <TeamSection />
      <TestimonialsSection />
      <ContactSection />
      <Footer />
      <AIChatWidget />
    </>
  );
}

export default HomePage;
