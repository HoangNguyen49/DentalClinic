// src/Pages/Accountant/index.tsx
import { Routes, Route } from "react-router-dom";
import MainDashboard from "./Dashboard/mainDashboard";
import GetAllProduct from "./Product/sections/GetAllProducts/GetAllProducts";
import CreateProduct from "./Product/sections/CreateProduct/CreateProduct";
import ProductByIdUpdate from "./Product/sections/GetProductById/ProductByIdUpdate/ProductByIdUpdate";

function AccountantRoutes() {
  return (
    <Routes>
      <Route element={<MainDashboard />}>
        <Route index element={<GetAllProduct />} />
        <Route path="create" element={<CreateProduct />} />
        <Route path="update/:id" element={<ProductByIdUpdate />} />
      </Route>
    </Routes>
  );
}

export default AccountantRoutes;
