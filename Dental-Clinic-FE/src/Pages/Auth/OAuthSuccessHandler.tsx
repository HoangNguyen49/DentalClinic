import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

function OAuthSuccessHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    const user = params.get("user");

    if (accessToken && user) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(user));
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("user", JSON.stringify(parsedUser));
        axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

        toast.success("Login with Google successful! Redirecting...");
        setTimeout(() => navigate("/"), 1500);
      } catch (err) {
        toast.error("Failed to parse user info.");
        navigate("/login");
      }
    } else {
      toast.error("Google login failed.");
      navigate("/login");
    }
  }, [navigate]);

  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />
  );
}

export default OAuthSuccessHandler;
