import ProtectedRoute from './ProtectedRoute'; 

const ProtectedRouteAdmin = () => {
  return (
    <ProtectedRoute 
      anyOf={["ADMIN", "ROLE_ADMIN"]} 
    />
  );
};

export default ProtectedRouteAdmin;