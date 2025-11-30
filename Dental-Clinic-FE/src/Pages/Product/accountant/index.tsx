// src/Pages/Product/accountant/sections/index.tsx
import React from 'react';
import CreateProduct from '../../Product/accountant/Product/sections/CreateProduct/CreateProduct.tsx';

const AccountantProduct: React.FC = () => {
    return (
        <main>
            <h1>Accountant – Product Management</h1>
            {/* Tạm thời chỉ có màn CreateProduct, sau này có thể thêm list, filter, v.v. */}
            <CreateProduct />
        </main>
    );
};

export default AccountantProduct;
