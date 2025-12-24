import { 
  Info, 
  AlertTriangle, 
  Stethoscope, 
  Loader2, 
  ChevronDown,
  ChevronRight,
  Printer,
  RefreshCw,
  Clock
} from "lucide-react";
import { useState } from "react";

// Legacy interface matching the old format from the image
interface LegacyAISummaryData {
  overview?: string;
  alerts?: string;
  recentTreatments?: string;
  rawSummary?: string;
  generatedAt?: string;
}


interface AISummaryPanelProps {
  summary: LegacyAISummaryData | null;
  loading: boolean;
  error: string | null;
  onRefresh?: () => void;
}

export default function AISummaryPanel({ 
  summary, 
  loading, 
  error, 
  onRefresh 
}: AISummaryPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    alerts: true,
    recentTreatments: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const cleanText = (text?: string) =>
  text
    ?.replace(/\\n|\n|\r/g, " ")
    ?.replace(/---/g, " ")
    ?.replace(/\s{2,}/g, " ")
    ?.trim() ?? "";

  const formatTreatments = (text?: string): string[] => {
  if (!text) return [];

  return text
    .replace(/\\n|\n|\r/g, " ")
    .split("*")
    .map(t => t.trim())
    .filter(t => t.length > 0);
};

const formatAlerts = (text?: string): string[] => {
  if (!text) return [];

  return text
    .replace(/\\n|\n|\r/g, " ")
    .split(". ")
    .map(a => a.trim())
    .filter(a => a.length > 10); // bỏ mấy câu rác quá ngắn
};



  const handlePrint = () => {
    const printContent = document.getElementById('ai-summary-content');
    if (printContent) {
      const originalContent = document.body.innerHTML;
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-[#0D1B3E] mb-6 flex items-center gap-2">
          <span className="text-blue-600">AI Support</span>
          <span className="text-gray-400">–</span>
          <span>Patient Summary</span>
        </h2>
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-600" />
          <p className="text-sm font-medium">Generating AI summary...</p>
          <p className="text-xs text-gray-400 mt-1">AI is analyzing patient data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">Error Loading Summary</span>
          </div>
          <p className="text-sm text-red-700 mb-3">
            Unable to load AI summary. {error}
          </p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Kiểm tra summary và các thuộc tính của nó
 if (!summary || (!summary.overview && !summary.alerts && !summary.recentTreatments)) 
  {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-[#0D1B3E] mb-4 flex items-center gap-2">
          <span className="text-blue-600">AI Support</span>
          <span className="text-gray-400">–</span>
          <span>Patient Summary</span>
        </h2>
        <div className="text-center py-8 text-gray-500">
          <Info className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium mb-1">No AI summary available</p>
          <p className="text-xs text-gray-400">Generate a summary to begin</p>
        </div>
      </div>
    );
  }

  // Kiểm tra an toàn trước khi gọi toLowerCase
  const hasAlerts = summary.alerts 
    ? !summary.alerts.toLowerCase().includes("no significant alerts")
    : false;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6" id="ai-summary-content">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#0D1B3E] flex items-center gap-2">
            <span className="text-blue-600">AI Support</span>
            <span className="text-gray-400">–</span>
            <span>Patient Summary</span>
          </h2>
          {summary.generatedAt && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <Clock className="w-3 h-3" />
              <span>Updated: {new Date(summary.generatedAt).toLocaleString()}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-1 transition-colors"
              title="Refresh analysis"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg flex items-center gap-1 transition-colors"
            title="Print report"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Simple Sections Display */}
      <div className="space-y-6">
        {/* Overview Section */}
        <section className="border-b border-gray-200 pb-4">
          <button
            onClick={() => toggleSection('overview')}
            className="flex items-center justify-between w-full mb-3 hover:bg-gray-50 p-1 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Overview</h3>
            </div>
            {expandedSections.overview ? 
              <ChevronDown className="w-5 h-5 text-gray-400" /> : 
              <ChevronRight className="w-5 h-5 text-gray-400" />
            }
          </button>
          
          {expandedSections.overview && summary.overview && (
            <p className="text-gray-700 leading-relaxed pl-7">{cleanText(summary.overview)}</p>
          )}
        </section>

        {/* Alerts Section */}
        <section className="border-b border-gray-200 pb-4">
          <button
            onClick={() => toggleSection('alerts')}
            className="flex items-center justify-between w-full mb-3 hover:bg-gray-50 p-1 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle
                className={`w-5 h-5 ${
                  hasAlerts ? "text-amber-600" : "text-gray-400"
                }`}
              />
              <h3 className="text-lg font-semibold text-gray-800">Alerts</h3>
              {hasAlerts && (
                <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                  Important
                </span>
              )}
            </div>
            {expandedSections.alerts ? 
              <ChevronDown className="w-5 h-5 text-gray-400" /> : 
              <ChevronRight className="w-5 h-5 text-gray-400" />
            }
          </button>
          
          {expandedSections.alerts && summary.alerts && (
  <ul className="pl-10 space-y-2 list-disc">
    {formatAlerts(summary.alerts).map((alert, index) => (
      <li
        key={index}
        className={`leading-relaxed ${
          hasAlerts ? "text-gray-800" : "text-gray-600"
        }`}
      >
        {alert.endsWith(".") ? alert : alert + "."}
      </li>
    ))}
  </ul>
)}

        </section>

        {/* Recent Treatments Section */}
        <section>
          <button
            onClick={() => toggleSection('recentTreatments')}
            className="flex items-center justify-between w-full mb-3 hover:bg-gray-50 p-1 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800">Recent Treatments</h3>
            </div>
            {expandedSections.recentTreatments ? 
              <ChevronDown className="w-5 h-5 text-gray-400" /> : 
              <ChevronRight className="w-5 h-5 text-gray-400" />
            }
          </button>
          
          {expandedSections.recentTreatments && (
  <ul className="pl-10 space-y-2 list-disc text-gray-700">
    {formatTreatments(summary.recentTreatments).map((item, index) => (
      <li key={index} className="leading-relaxed">
        {item}
      </li>
    ))}
  </ul>
)}
        </section>
      </div>
    </div>
  );
}