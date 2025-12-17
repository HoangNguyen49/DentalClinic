import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';


export const getStatusIcon = (status: string) => {
  switch (status.toUpperCase()) {
    case "APPROVED":
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case "REJECTED":
      return <XCircle className="w-5 h-5 text-red-600" />;
    case "PENDING":
      return <Clock className="w-5 h-5 text-yellow-600" />;
    case "PENDING_ADMIN":
      return <Clock className="w-5 h-5 text-purple-600" />;
    case "PENDING_HR":
      return <Clock className="w-5 h-5 text-orange-600" />;
    default:
      return <AlertCircle className="w-5 h-5 text-gray-600" />;
  }
};

/**
 * Get Tailwind CSS gradient color classes for status badge
 * @param status - Leave request status
 * @returns Tailwind gradient classes string
 */
export const getStatusColor = (status: string): string => {
  switch (status.toUpperCase()) {
    case "APPROVED":
      return "from-green-500 to-emerald-600";
    case "REJECTED":
      return "from-red-500 to-rose-600";
    case "PENDING":
      return "from-yellow-500 to-amber-600";
    case "PENDING_ADMIN":
      return "from-purple-500 to-pink-600";
    case "PENDING_HR":
      return "from-orange-500 to-yellow-600";
    default:
      return "from-gray-500 to-slate-600";
  }
};

/**
 * Get background color classes for status badge
 * @param status - Leave request status
 * @returns Tailwind background color classes
 */
export const getStatusBgColor = (status: string): string => {
  switch (status.toUpperCase()) {
    case "APPROVED":
      return "bg-green-100 text-green-800 border-green-300";
    case "REJECTED":
      return "bg-red-100 text-red-800 border-red-300";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "PENDING_ADMIN":
      return "bg-purple-100 text-purple-800 border-purple-300";
    case "PENDING_HR":
      return "bg-orange-100 text-orange-800 border-orange-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

/**
 * Get translated status label
 * @param status - Leave request status
 * @param t - Translation function from react-i18next
 * @returns Translated status label
 */
export const getStatusLabel = (status: string, t: any): string => {
  switch (status.toUpperCase()) {
    case "APPROVED":
      return t("leaveRequest.status.approved", "Approved");
    case "REJECTED":
      return t("leaveRequest.status.rejected", "Rejected");
    case "PENDING":
      return t("leaveRequest.status.pending", "Pending");
    case "PENDING_ADMIN":
      return t("leaveRequest.status.pendingAdmin", "Pending Admin");
    case "PENDING_HR":
      return t("leaveRequest.status.pendingHR", "Pending HR");
    default:
      return status;
  }
};

/**
 * Get translated leave request type label
 * @param type - Leave request type (VACATION, SICK, PERSONAL, etc.)
 * @param t - Translation function from react-i18next
 * @returns Translated type label
 */
export const getTypeLabel = (type: string, t: any): string => {
  switch (type.toUpperCase()) {
    case "VACATION":
      return t("leaveRequest.types.vacation", "Vacation");
    case "SICK":
      return t("leaveRequest.types.sick", "Sick Leave");
    case "PERSONAL":
      return t("leaveRequest.types.personal", "Personal");
    case "MATERNITY":
      return t("leaveRequest.types.maternity", "Maternity");
    case "PATERNITY":
      return t("leaveRequest.types.paternity", "Paternity");
    case "UNPAID":
      return t("leaveRequest.types.unpaid", "Unpaid");
    default:
      return type;
  }
};
