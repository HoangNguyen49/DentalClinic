import { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { fetchGoongAutocomplete, fetchGoongGeocode, type GoongPrediction } from "../../../../huybro_api/goongApi";

type Props = {
  value: string;
  onChange: (val: string) => void;
  error?: React.ReactNode;
  disabled?: boolean;
};

export default function AddressAutocompleteInput({ value, onChange, error, disabled }: Props) {
  const [suggestions, setSuggestions] = useState<GoongPrediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  // State lưu tọa độ người dùng để Search khôn hơn
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Search (Debounce)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (value && value.length > 2 && showDropdown) {
        try {
          // TRUYỀN TOẠ ĐỘ VÀO ĐÂY ĐỂ NÓ KHÔN HƠN
          const preds = await fetchGoongAutocomplete(value, userCoords);
          setSuggestions(preds);
        } catch (e) {
          console.error(e);
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [value, showDropdown, userCoords]); // Thêm userCoords vào dependency

  // Handle: Lấy vị trí hiện tại
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser does not support geolocation");
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // 1. Lưu tọa độ để dùng cho việc Search sau này
          setUserCoords({ lat: latitude, lng: longitude });

          // 2. Lấy địa chỉ text điền vào ô input luôn
          const address = await fetchGoongGeocode(latitude, longitude);
          if (address) {
            onChange(address);
            setShowDropdown(false);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingLocation(false);
        }
      },
      () => {
        setLoadingLocation(false);
        // Có thể user block location, vẫn cho nhập tay nhưng search sẽ kém chính xác hơn chút
        alert("Please allow location access for better suggestions.");
      }
    );
  };

  return (
    <div className="relative" ref={wrapperRef}>
      
      {/* HEADER: Label + Button Định vị nằm ở đây */}
      <div className="flex justify-between items-end mb-1">
        <div className="flex items-center">
          <span className="text-gray-500 font-medium">Address</span>
          <span className="text-xs text-red-500 ml-1">*</span>
        </div>

        {/* Nút nằm ở đây, rõ ràng, dễ thấy */}
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={disabled || loadingLocation}
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
        >
          {loadingLocation ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Locating...</span>
            </>
          ) : (
            <>
              <Navigation className="w-3 h-3" />
              <span>Use current location</span>
            </>
          )}
        </button>
      </div>

      {/* INPUT FIELD: Clean, không còn icon bên trong làm rối */}
      <div className="relative">
        <input
          type="text"
          value={value}
          disabled={disabled || loadingLocation}
          onChange={(e) => {
            onChange(e.target.value);
            setShowDropdown(true);
          }}
          placeholder="e.g. 115 Cây Trôm..."
          className={`w-full border-b border-gray-300 rounded-none px-0 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-0 bg-transparent placeholder:text-gray-400 transition-colors ${loadingLocation ? 'opacity-50' : ''}`}
          autoComplete="off"
        />
      </div>

      {error}

      {/* DROPDOWN */}
      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-xl mt-1 max-h-60 overflow-y-auto">
          {suggestions.map((item) => (
            <li
              key={item.place_id}
              onClick={() => {
                onChange(item.description);
                setShowDropdown(false);
              }}
              className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 flex items-start gap-3 border-b border-gray-100 last:border-0"
            >
              <MapPin className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
              <span>{item.description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}