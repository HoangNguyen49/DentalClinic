import ProtectedRoute from './ProtectedRoute';

const ProtectedRouteReception = () => {
  // Truyền danh sách các Role được phép truy cập vào đây
  // Bao gồm cả "RECEPTION" và "ADMIN" để khớp với logic Backend
  return (
    <ProtectedRoute 
      anyOf={["RECEPTION", "ROLE_RECEPTION", "ADMIN", "ROLE_ADMIN"]} 
    />
  );
};

export default ProtectedRouteReception;