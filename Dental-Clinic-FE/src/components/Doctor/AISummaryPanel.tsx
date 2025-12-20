import { Info, AlertTriangle, Stethoscope, Loader2 } from "lucide-react";

interface AISummaryData {
  overview: string;
  alerts: string;
  recentTreatments: string;
  rawSummary?: string;
}

interface AISummaryPanelProps {
  summary: AISummaryData | null;
  loading: boolean;
  error: string | null;
}

export default function AISummaryPanel({ summary, loading, error }: AISummaryPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-[#0D1B3E] mb-6 flex items-center gap-2">
        <span className="text-blue-600">AI Support</span>
        <span className="text-gray-400">–</span>
        <span>Patient Summary</span>
      </h2>

      {loading && (
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-600" />
          <p className="text-sm">Generating AI summary...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">Error</span>
          </div>
          <p className="text-sm text-red-700">
            Unable to load AI summary. Please try refreshing the page.
          </p>
        </div>
      )}

      {!loading && !error && summary && (
        <div className="space-y-6">
          {/* Overview Section */}
          <section className="border-b border-gray-200 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Overview</h3>
            </div>
            <p className="text-gray-700 leading-relaxed pl-7">{summary.overview}</p>
          </section>

          {/* Alerts Section */}
          <section className="border-b border-gray-200 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle
                className={`w-5 h-5 ${
                  summary.alerts.toLowerCase().includes("no significant alerts")
                    ? "text-gray-400"
                    : "text-amber-600"
                }`}
              />
              <h3 className="text-lg font-semibold text-gray-800">Alerts</h3>
              {!summary.alerts.toLowerCase().includes("no significant alerts") && (
                <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                  Important
                </span>
              )}
            </div>
            <p
              className={`leading-relaxed pl-7 ${
                summary.alerts.toLowerCase().includes("no significant alerts")
                  ? "text-gray-600"
                  : "text-gray-700"
              }`}
            >
              {summary.alerts}
            </p>
          </section>

          {/* Recent Treatments Section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Stethoscope className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800">Recent Treatments</h3>
            </div>
            <p className="text-gray-700 leading-relaxed pl-7">{summary.recentTreatments}</p>
          </section>
        </div>
      )}

      {!loading && !error && !summary && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No summary available
        </div>
      )}
    </div>
  );
}

