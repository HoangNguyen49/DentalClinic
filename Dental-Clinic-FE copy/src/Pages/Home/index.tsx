import Header from "../../widgets/Header/Header";
import Hero from "./sections/Hero";
import AboutSection from "./sections/AboutSection";
import TrustedBySection from "./sections/TrustedBySection";
import TeamSection from "./sections/TeamSection";
import TestimonialsSection from "./sections/TestimonialsSection";
import ContactSection from "./sections/ContactSection";
import Footer from "../../widgets/Footer/Footer";

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
    </>
  );
}

export default HomePage;
