import React, { useState } from "react";
import { AlertTriangle, ChevronRight, Info } from "lucide-react"; // Bỏ UserPlus
import { useNavigate } from "react-router-dom";
import { type UserSnapshot } from "../../../../../huybro_api/payrollApi";

interface Props {
  missingUsers: UserSnapshot[];
}

const MissingConfigAlert: React.FC<Props> = ({ missingUsers }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!missingUsers || missingUsers.length === 0) return null;

  const handleQuickFix = (user: UserSnapshot) => {
    // Chuyển hướng và mang theo dữ liệu user (state)
    navigate("/accountant/payroll/config", { state: { preSelectedUser: user } });
  };

  return (
    <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2 overflow-hidden">
      {/* Header của Alert */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            onClick={() => setIsExpanded((prev) => !prev)}
            className={`
    p-2 rounded-full cursor-pointer
    bg-orange-100 text-orange-600
    transition-all duration-300 ease-out
    hover:scale-110
    active:scale-95
    ${isExpanded ? "bg-orange-200 text-orange-700" : ""}
  `}
          >
            <AlertTriangle
              size={20}
              className="transition-opacity duration-300"
            />
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Salary Configuration Warning
            </h3>
            <p className="text-sm text-gray-600 mt-0.5">
              <span className="font-bold text-orange-700">
                {missingUsers.length} employees
              </span>{" "}
              missing salary contracts.
            </p>
          </div>
        </div>
      </div>

      {/* Danh sách nhân viên (Dạng thẻ Clickable) */}
      {isExpanded && (
        <div className="bg-orange-100/50 border-t border-orange-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {missingUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => handleQuickFix(user)} // Click vào cả thẻ
                className="group bg-white p-3 rounded border border-orange-200 shadow-sm cursor-pointer hover:bg-orange-50 hover:border-orange-300 transition-all flex justify-between items-center"
                title="Bấm để cấu hình lương cho nhân viên này"
              >
                <div>
                  <div className="font-bold text-sm text-gray-800 group-hover:text-orange-700 transition-colors">
                    {user.fullName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user.code} • {user.roleName}
                  </div>
                </div>

                {/* Mũi tên chỉ hướng */}
                <ChevronRight
                  size={16}
                  className="text-gray-300 group-hover:text-orange-500 transition-colors"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MissingConfigAlert;
