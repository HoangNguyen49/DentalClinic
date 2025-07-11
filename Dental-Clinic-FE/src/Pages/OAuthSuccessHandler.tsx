import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function OAuthSuccessHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    if (accessToken) {
      localStorage.setItem("access_token", accessToken);
      toast.success("Login with Google successful! Redirecting...");
      setTimeout(() => navigate("/"), 1500);
    } else {
      toast.error("Google login failed.");
      navigate("/login");
    }
  }, [navigate]);

  return <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />;
}

export default OAuthSuccessHandler;
