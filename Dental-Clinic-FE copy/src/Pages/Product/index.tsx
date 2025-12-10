import { Routes, Route } from "react-router-dom";
import Header from "../../widgets/Header/Header";
import Footer from "../../widgets/Footer/Footer";
import GetAllProducts from "./sections/GetAllProducts/GetAllProducts";
import GetProductById from "./sections/GetProductById/GetProductById";

function Product() {
  return (
    <>
      <Header />
      <Routes>
        <Route index element={<GetAllProducts />} />
        <Route path=":id" element={<GetProductById />} />
      </Routes>
      <Footer />
    </>
  );
}

export default Product;
