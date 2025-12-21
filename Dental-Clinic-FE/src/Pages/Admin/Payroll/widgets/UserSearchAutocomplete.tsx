import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Check, Loader2, User as UserIcon } from 'lucide-react';
import { payrollApi, type UserSnapshot } from '../../../../huybro_api/payrollApi';

interface Props {
  selectedUserId: number | null;
  onSelect: (user: UserSnapshot | null) => void;
  disabled?: boolean;
  initialUser?: UserSnapshot | null;
}

const UserSearchAutocomplete: React.FC<Props> = ({ 
  selectedUserId, 
  onSelect, 
  disabled,
  initialUser
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSnapshot[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDisplay, setSelectedDisplay] = useState<UserSnapshot | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    if (initialUser) {
      console.log("Autocomplete received initialUser:", initialUser);
      setSelectedDisplay(initialUser);
    } else if (!selectedUserId) {
      // Nếu bên ngoài reset (selectedUserId = 0/null) -> Xóa hiển thị
      setSelectedDisplay(null);
      setQuery('');
    }
  }, [initialUser, selectedUserId]);

  // Debounce search API
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await payrollApi.searchEmployees(query);
        
        // [FIX BUGS HERE] Kiểm tra kỹ dữ liệu trả về trước khi set state
        if (res && Array.isArray(res.data)) {
            setResults(res.data);
        } else if (res && res.data && Array.isArray((res.data as any).content)) {
            // Trường hợp backend trả về Pagination (Page<User>)
            setResults((res.data as any).content);
        } else {
            console.warn("API response is not an array:", res.data);
            setResults([]); // Fallback về mảng rỗng để không lỗi .map
        }
        
        setIsOpen(true);
      } catch (error) {
        console.error(error);
        setResults([]); // Lỗi thì set rỗng
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // UI khi đã chọn User
  if (selectedDisplay) {
    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Selected Employee
        </label>
        <div className={`flex items-center justify-between p-3 border rounded-lg bg-blue-50 border-blue-200 ${disabled ? 'opacity-80' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700">
               <UserIcon size={16} />
            </div>
            <div>
              <div className="font-bold text-blue-900 text-sm">{selectedDisplay.fullName}</div>
              <div className="text-xs text-blue-700">{selectedDisplay.email}</div>
            </div>
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

  // UI Search Input
  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Search Employee <span className="text-red-500">*</span>
      </label>
      
      <div className="relative">
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          placeholder="Type name or email..."
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

      {/* Dropdown Results - [FIX BUGS HERE] Thêm kiểm tra Array.isArray */}
      {isOpen && Array.isArray(results) && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto">
          {results.map((user) => (
            <button
              key={user.id || user.id} 
              type="button"
              onClick={() => {
                setSelectedDisplay(user);
                onSelect(user);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors flex justify-between items-center"
            >
              <div>
                <div className="font-semibold text-gray-800 text-sm">{user.fullName}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {isOpen && query && Array.isArray(results) && results.length === 0 && !loading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-4 text-center text-gray-500 text-sm">
          No employees found matching "{query}"
        </div>
      )}
    </div>
  );
};

export default UserSearchAutocomplete;

