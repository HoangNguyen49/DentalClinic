import Header from "../components/Header";
import Hero from "../components/Home/Hero";
import AboutSection from "../components/Home/AboutSection";
import TrustedBySection from "../components/Home/TrustedBySection";
import TeamSection from "../components/Home/TeamSection";
import TestimonialsSection from "../components/Home/TestimonialsSection";
import ContactSection from "../components/Home/ContactSection";
import Footer from "../components/Footer";

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
