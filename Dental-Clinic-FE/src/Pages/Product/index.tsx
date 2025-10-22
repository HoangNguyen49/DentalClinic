import Header from "../../widgets/Header/Header";
import Footer from "../../widgets/Footer/Footer";
import GetAllProducts from "./sections/GetAllProducts/GetAllProducts";
import GetProductById from "./sections/GetProductById/GetProductById";

function Product() {
  return (
    <>
      <Header />

      {/* bỏ sau khi thiết kế UX */}
      <h1>Products (raw)</h1>

      <GetAllProducts />

      {/* bỏ sau khi thiết kế UX */}
      <hr />
      
      <GetProductById />
      <Footer />
    </>
  );
}

export default Product;
