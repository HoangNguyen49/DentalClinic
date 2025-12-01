// src/widgets/Header/CartIconButton.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShoppingBasket } from "lucide-react";
import {
  getCartItemCount,
  CART_UPDATED_EVENT,
} from "../../../../utils/cartSession";

// -----------------------------------------------------
//  Inject CSS keyframes trực tiếp ngay trong file TSX
// -----------------------------------------------------
const cartPulseStyle = `
@keyframes cartPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.035); }
  100% { transform: scale(1); }
}
`;

function CartIconButton() {
  const location = useLocation();
  const navigate = useNavigate();
  const [count, setCount] = useState(0);

  useEffect(() => {
    // nhúng style vào head
    const styleTag = document.createElement("style");
    styleTag.innerHTML = cartPulseStyle;
    document.head.appendChild(styleTag);
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  // update cart badge
  useEffect(() => {
    const updateCount = () => setCount(getCartItemCount());

    updateCount();
    window.addEventListener(
      CART_UPDATED_EVENT,
      updateCount as EventListener
    );
    window.addEventListener("storage", updateCount);

    return () => {
      window.removeEventListener(
        CART_UPDATED_EVENT,
        updateCount as EventListener
      );
      window.removeEventListener("storage", updateCount);
    };
  }, []);

  // Detect route → /products , /products/:id
  const pathname = location.pathname;
  const isProductRoute =
    pathname === "/products" || pathname.startsWith("/products/");

  // subtle scale animation
  const subtlePulse = isProductRoute
    ? "animate-[cartPulse_1.8s_ease-in-out_infinite]"
    : "";

  const btnClass = [
    "relative",
    "px-4 py-2 rounded-full text-white font-semibold shadow-md",
    "bg-gradient-to-r from-[#AACCFF] via-[#6699FF] to-[#3366FF]",
    "flex items-center justify-center gap-1",
    "transition-transform duration-300 hover:scale-105",
    subtlePulse,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      onClick={() => navigate("/cart")}
      className={btnClass}
      aria-label="Open cart"
    >
      <ShoppingBasket className={`w-6 h-6 ${count > 0 ? "mr-1" : ""}`} />
      {count > 0 && (
        <span
          className="
            absolute
            top-[6px] right-[8px] 
            min-w-[14px] h-[14px] 
            flex items-center justify-center
            text-[10px] text-white font-bold
          "
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default CartIconButton;
