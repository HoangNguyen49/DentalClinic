import Header from "../../widgets/Header/Header";
import Footer from "../../widgets/Footer/Footer";
import ServicesGrid from "./sections/ServicesGrid";
import WhyChooseUs from "./sections/WhyChooseUs";
import HowItWorks from "./sections/HowItWorks";
import Faq from "./sections/Faq";

function Service(){
return(
    <>
       <Header />
       <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
       <ServicesGrid/>
       <WhyChooseUs/>
       <HowItWorks/>
       <Faq/>
       </main>
       <Footer />
    </>
)
}

export default Service;