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
       <ServicesGrid/>
       <WhyChooseUs/>
       <HowItWorks/>
       <Faq/> 
       <Footer />
    </>
)
}

export default Service;