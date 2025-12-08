import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Check, Loader2 } from 'lucide-react';
import { fetchAccountantProductsPage, type Product } from '../../../../../huybro_api/productApi';

interface Props {
  selectedProductId: number | '';
  onSelect: (product: Product | null) => void;
  disabled?: boolean;
  initialProduct?: Product | null; // Dùng khi load từ URL
}

const ProductSearchAutocomplete: React.FC<Props> = ({ 
  selectedProductId, 
  onSelect, 
  disabled,
  initialProduct 
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDisplay, setSelectedDisplay] = useState<Product | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Xử lý click outside để đóng dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Xử lý khi có initialProduct (từ URL)
  useEffect(() => {
    if (initialProduct) {
      setSelectedDisplay(initialProduct);
    }
  }, [initialProduct]);

  // Debounce search API
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // Gọi API search SKU/Name
        const res = await fetchAccountantProductsPage({ 
            keyword: query, 
            page: 0, 
            size: 5 
        });
        setResults(res.content || []);
        setIsOpen(true);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }, 400); // Delay 400ms

    return () => clearTimeout(timer);
  }, [query]);

  // Render UI khi đã chọn sản phẩm
  if (selectedDisplay) {
    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Selected Product
        </label>
        <div className={`flex items-center justify-between p-3 border rounded-lg bg-blue-50 border-blue-200 ${disabled ? 'opacity-80' : ''}`}>
          <div>
            <div className="font-bold text-blue-900">{selectedDisplay.sku}</div>
            <div className="text-sm text-blue-700">{selectedDisplay.productName}</div>
          </div>
          
          {!disabled && (
            <button
              type="button"
              onClick={() => {
                setSelectedDisplay(null);
                onSelect(null);
                setQuery('');
              }}
              className="p-1 hover:bg-blue-100 rounded-full text-blue-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          {disabled && <Check className="w-5 h-5 text-blue-600" />}
        </div>
      </div>
    );
  }

  // Render UI khung tìm kiếm
  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Search Product <span className="text-red-500">*</span>
      </label>
      
      <div className="relative">
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          placeholder="SKU or Product Name..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query && setIsOpen(true)}
          disabled={disabled}
        />
        <div className="absolute left-3 top-2.5 text-gray-400">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto">
          {results.map((product) => (
            <button
              key={product.productId}
              type="button"
              onClick={() => {
                setSelectedDisplay(product);
                onSelect(product);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors flex justify-between items-center"
            >
              <div>
                <div className="font-semibold text-gray-800 text-sm">{product.sku}</div>
                <div className="text-sm text-gray-600 truncate max-w-[250px]">{product.productName}</div>
              </div>
              <div className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">
                Unit: {product.unit}
              </div>
            </button>
          ))}
        </div>
      )}
      
      {isOpen && query && results.length === 0 && !loading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-4 text-center text-gray-500 text-sm">
          No products found matching "{query}"
        </div>
      )}
    </div>
  );
};

export default ProductSearchAutocomplete;