import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "../../../huybro_api/productApi";
import { getProductImageSrc } from "../../../huybro_api/productApi";
import { useNavigate } from "react-router-dom";

type Props = {
  product: Product;
  autoPlayMs?: number;
  className?: string;
};

export default function CardProduct({
  product,
  autoPlayMs = 1200,
  className = "",
}: Props) {
  const images = useMemo(
    () => (product.image ?? []).slice().sort((a, b) => a.imageOrder - b.imageOrder),
    [product.image]
  );

  const [idx, setIdx] = useState(0);
  const [hovering, setHovering] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!hovering || images.length <= 1) return;
    timerRef.current = window.setInterval(() => {
      setIdx((i) => (i + 1) % images.length);
    }, autoPlayMs);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [hovering, images.length, autoPlayMs]);

  const priceText =
    product.currency === "USD"
      ? `$ ${Number(product.defaultRetailPrice).toFixed(2)}`
      : `${product.currency} ${Number(product.defaultRetailPrice).toFixed(2)}`;

  const productId = String(product.productId);
  const navigate = useNavigate();
  const goDetail = () => navigate(`/products/${productId}`);

  return (
    <div
      onClick={goDetail}                
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {               
        if (e.key === "Enter" || e.key === " ") goDetail();
      }}
      className={[
        "relative rounded-3xl p-[2px]",
        "before:absolute before:inset-0 before:rounded-3xl",
        "before:bg-gradient-to-r before:from-[#FFFFFF] before:via-[#DDE3F8] before:to-[#AACCFF]",
        "before:opacity-30 before:transition-opacity before:duration-300",
        "transform transition-transform duration-300 ease-in-out hover:scale-105",
        className,
      ].join(" ")}
    >
      <div className="relative h-full rounded-[calc(1.5rem-2px)] bg-white/10 backdrop-blur-2xl border border-white/25 overflow-hidden flex flex-col">
        <div
          className="relative w-full aspect-square bg-gray-100 overflow-hidden outline-none"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => {
            setHovering(false);
            setIdx(0);
          }}
          onFocus={() => setHovering(true)}
          onBlur={() => {
            setHovering(false);
            setIdx(0);
          }}
          tabIndex={0}
          aria-label="Product gallery"
        >
          {images.length > 0 ? (
            <img
              key={images[idx].imageId ?? idx}
              src={getProductImageSrc(images[idx].imageUrl)}
              alt={product.productName}
              className="absolute inset-0 h-full w-full object-contain transition-opacity duration-500 bg-white"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
              No image
            </div>
          )}

          {/* hint hover */}
          {images.length > 1 && !hovering && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full bg-black/40 text-white text-[11px]">
              Hover to preview
            </div>
          )}

          {/* dots */}
          {images.length > 1 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={[
                    "h-1.5 w-1.5 rounded-full",
                    i === idx ? "bg-white" : "bg-white/50",
                  ].join(" ")}
                />
              ))}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t to-transparent pointer-events-none" />
        </div>

        <div className="p-4 sm:p-5 flex flex-col grow">
          <h3
            className="
              text-lg sm:text-xl font-semibold tracking-tight text-[#0D1B3E]
              line-clamp-2
              min-h-[3.25rem]
            "
            title={product.productName}
          >
            {product.productName}
          </h3>

          <div
            className="
              mt-1 text-xs sm:text-sm text-[#0D1B3E]/70
              whitespace-nowrap overflow-hidden text-ellipsis
              min-h-[1.25rem]
              text-right
            "
            title={`${product.brand} • ${product.sku}`}
          >
            {product.brand} • {product.sku}
          </div>

          <div className="grow" />

          <div className="flex items-center justify-between pt-3">
            <div className="inline-flex items-center justify-center gap-2 rounded-2xl h-10 sm:h-11 px-4 border border-white/25 bg-white/10 backdrop-blur-2xl leading-none">
              <span className="text-base sm:text-lg font-bold text-[#0D1B3E]">
                {priceText}
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation();}}
              className="inline-flex items-center justify-center gap-2 rounded-2xl h-10 sm:h-11 px-4 border border-white/25 bg-white/10 backdrop-blur-2xl text-[#0D1B3E] text-base sm:text-lg font-bold active:scale-[0.98] transition leading-none"
              aria-label="Add to cart"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h7.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
