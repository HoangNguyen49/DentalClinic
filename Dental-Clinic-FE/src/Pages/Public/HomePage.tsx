import Header from "../../components/Header";
import Hero from "../../components/WebHomePage/Hero";
import AboutSection from "../../components/WebHomePage/AboutSection";
import TrustedBySection from "../../components/WebHomePage/TrustedBySection";
import TeamSection from "../../components/WebHomePage/TeamSection";
import TestimonialsSection from "../../components/WebHomePage/TestimonialsSection";
import ContactSection from "../../components/WebHomePage/ContactSection";
import Footer from "../../components/Footer";

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
