import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function SignUp() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!fullName || !username || !email || !password || !confirmPassword || !phone) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/users`, {
        fullName,
        username,
        password,
        email,
        phone,
        role: "User",
      });
      toast.success("Registration successful, redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.message;
      if (Array.isArray(errorMessage)) {
        errorMessage.forEach((msg: string) => toast.error(msg));
      } else {
        toast.error(errorMessage || "Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
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
      <div className="min-h-screen flex items-center justify-center bg-white p-16">
        <div className="flex w-full max-w-7xl rounded-[2rem] shadow-2xl border-4 border-gray-300 overflow-hidden">
          <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#0D1B3E] to-[#3366FF] items-center justify-center text-white p-20">
            <div className="text-center space-y-6">
              <h1 className="text-5xl font-bold">Sign Up</h1>
              <p className="text-lg">Join us and start your journey</p>
            </div>
          </div>

          <div className="flex w-full md:w-1/2 items-center justify-center bg-white p-16">
            <form onSubmit={handleSignUp} className="w-full max-w-md space-y-6">
              <h2 className="text-3xl font-bold text-center">
                Create your account
              </h2>
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3366FF] text-base"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3366FF] text-base"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3366FF] text-base"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3366FF] text-base"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3366FF] text-base"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3366FF] text-base"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#3366FF] text-white font-semibold py-3 rounded hover:bg-[#254EDB] transition text-base"
              >
                {loading ? "Signing up..." : "Sign Up"}
              </button>
              <p className="text-center text-sm">
                Already have an account?{" "}
                <a href="/login" className="text-[#3366FF] hover:underline">
                  Login
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default SignUp;
