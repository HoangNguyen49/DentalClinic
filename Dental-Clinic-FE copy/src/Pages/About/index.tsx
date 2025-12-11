import Header from "../../widgets/Header/Header";
import Footer from "../../widgets/Footer/Footer";
import AboutUsTop from "./sections/Card_AboutUs";
import OurMission from "./sections/Our_Mission";
import FeaturedDoctor from "./sections/FeaturedDoctor";
import ValuesAndCTA from "./sections/ValuesAndCTA";
function About(){
return(
    <>
       <Header />
       <AboutUsTop/>
       <OurMission/>
       <FeaturedDoctor/>
       <ValuesAndCTA/>
       <Footer />
    </>
)
}

export default About;