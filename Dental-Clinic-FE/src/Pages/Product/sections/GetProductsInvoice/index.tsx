// src/pages/Cart/index.tsx
import { Routes, Route } from "react-router-dom";
import Header from "../../../../widgets/Header/Header";
import Footer from "../../../../widgets/Footer/Footer";
import GetProductsInvoice from "./Invoice/GetProductsInvoice";

function Cart() {
  return (
    <>
      <Header />
      <Routes>
        <Route index element={<GetProductsInvoice />} />
      </Routes>
      <Footer />
    </>
  );
}

export default Cart;
