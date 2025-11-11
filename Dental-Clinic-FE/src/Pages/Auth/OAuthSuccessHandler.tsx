import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

type UserInfo = {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  username?: string;
  avatarUrl?: string;
  roles?: string[];
  hasPassword?: boolean;
};

function OAuthSuccessHandler() {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      const params = new URLSearchParams(window.location.search);
      const accessToken = params.get("access_token");

      if (!accessToken) {
        toast.error("Google login failed (no token).");
        navigate("/login", { replace: true });
        return;
      }

      try {
        localStorage.setItem("accessToken", accessToken);
        axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

        const { data } = await axios.get<UserInfo>(`${API}/api/users/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        localStorage.setItem("user", JSON.stringify(data));
        localStorage.setItem("roles", JSON.stringify(data.roles ?? []));

        
        window.history.replaceState({}, document.title, window.location.pathname);

      
        const hasContainer =
          typeof document !== "undefined" &&
          !!document.querySelector(".Toastify");

        if (hasContainer) {
          if (!toast.isActive("oauth-success")) {
            toast.success("Login with Google successful!", {
              toastId: "oauth-success",
              autoClose: 1200,
              pauseOnHover: false,
              closeOnClick: true,
              onClose: () => navigate("/", { replace: true }),
            });
          }
        } else {
          setTimeout(() => navigate("/", { replace: true }), 300);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch user profile.");
        navigate("/login", { replace: true });
      }
    })();
  }, [navigate, API]);

  return null; 
}

export default OAuthSuccessHandler;
