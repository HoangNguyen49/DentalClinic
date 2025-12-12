import { Routes, Route } from "react-router-dom";

// Layout
import MainDashboard from "./Dashboard/mainDashboard";
// Product Modules
import GetAllProduct from "./Product/sections/GetAllProducts/GetAllProducts";
import CreateProduct from "./Product/sections/CreateProduct/CreateProduct";
import ProductByIdUpdate from "./Product/sections/GetProductById/ProductByIdUpdate/ProductByIdUpdate";
// Inventory Modules
import ImportStock from "./Inventory/sections/ImportStock/ImportStock";
import InventoryExport from "./Inventory/sections/InventoryExport/InventoryExport"; 
import InventoryHistory from "./Inventory/sections/InventoryHistory/InventoryHistory";
import UpdateInventory from "./Inventory/sections/InventoryGetById/UpdateInventory";
import InvoiceListPage from "./Invoice/GetAllInvoices/InvoiceListPage";
import InvoiceDetailPage from "./Invoice/GetInvoiceById/InvoiceDetailPage";
import Report from "./Report/Report";

function AccountantRoutes() {
  return (
    <Routes>
      {/* Layout bọc ngoài (Sidebar + Navbar) */}
      <Route element={<MainDashboard />}>
        
        {/* === HOME / DASHBOARD === */}
        {/* Mặc định vào là danh sách sản phẩm (hoặc Dashboard nếu bạn có) */}
        <Route path="product" element={<GetAllProduct />} />

        {/* === PRODUCT ROUTES === */}
        <Route path="product/create" element={<CreateProduct />} />
        <Route path="product/update/:id" element={<ProductByIdUpdate />} />

        {/* === INVENTORY ROUTES === */}
        {/* 1. Nhập kho */}
        <Route path="inventory/import" element={<ImportStock />} />
        
        {/* 2. Xem danh sách tồn kho (View/Export) */}
        <Route path="inventory" element={<InventoryExport />} />
        
        {/* 3. Cập nhật tồn kho chi tiết (Update) */}
        <Route path="inventory/update/:id" element={<UpdateInventory />} />

        {/* 4. Xem lịch sử nhập kho của sản phẩm */}
        <Route path="inventory/history/:productId" element={<InventoryHistory />} />

        {/* === [NEW] SALES & FINANCE (INVOICES) === */}
        {/* href sidebar là: /accountant/invoices -> path ở đây là "invoices" */}
        <Route path="invoices" element={<InvoiceListPage />} />
        
        {/* Route xem chi tiết: /accountant/invoices/ */}
        <Route path="invoices/:id" element={<InvoiceDetailPage />} />

        <Route path="reports" element={<Report />} />

      </Route>
    </Routes>
  );
}

export default AccountantRoutes;