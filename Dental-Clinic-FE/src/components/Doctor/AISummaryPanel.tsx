import { 
  Info, 
  AlertTriangle, 
  Stethoscope, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  FileWarning,
  ShieldAlert,
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
  Printer,
  RefreshCw,
  Clock
} from "lucide-react";
import { useState } from "react";

interface DataQualityIssue {
  issue: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  suggestion: string;
}

interface RiskFactor {
  factor: string;
  evidence: string;
  impact: 'MINOR' | 'MODERATE' | 'SIGNIFICANT';
}

// New interface with enhanced fields
interface AISummaryData {
  overview: string;
  attentionLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  dataQualityIssues: DataQualityIssue[];
  riskFactors: RiskFactor[];
  advisoryNotes: string[];
  summaryReport: string;
  rawSummary?: string;
  generatedAt?: string;
}

// Fallback interface for old API response (backward compatibility)
interface LegacyAISummaryData {
  overview: string;
  alerts: string;
  recentTreatments: string;
  rawSummary?: string;
}

interface AISummaryPanelProps {
  summary: AISummaryData | LegacyAISummaryData | null;
  loading: boolean;
  error: string | null;
  onRefresh?: () => void;
}

// Type guard to check if data is in new format
const isNewFormat = (data: any): data is AISummaryData => {
  return data && 'attentionLevel' in data && 'dataQualityIssues' in data;
};

// Convert old format to new format for backward compatibility
const convertLegacyToNewFormat = (legacyData: LegacyAISummaryData): AISummaryData => {
  return {
    overview: legacyData.overview,
    attentionLevel: legacyData.alerts.toLowerCase().includes("no significant alerts") ? "LOW" : "MEDIUM",
    dataQualityIssues: [],
    riskFactors: [],
    advisoryNotes: [],
    summaryReport: `${legacyData.overview}\n\nAlerts: ${legacyData.alerts}\n\nRecent Treatments: ${legacyData.recentTreatments}`,
    rawSummary: legacyData.rawSummary,
    generatedAt: new Date().toISOString()
  };
};

export default function AISummaryPanel({ 
  summary, 
  loading, 
  error, 
  onRefresh 
}: AISummaryPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    dataQuality: true,
    riskFactors: true,
    advisoryNotes: true,
    fullReport: false
  });

  // Convert data to new format if needed
  const getFormattedSummary = (): AISummaryData | null => {
    if (!summary) return null;
    
    if (isNewFormat(summary)) {
      return summary;
    } else {
      return convertLegacyToNewFormat(summary);
    }
  };

  const formattedSummary = getFormattedSummary();
  const isLegacyFormat = summary && !isNewFormat(summary);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Helper functions for styling
  const getAttentionLevelConfig = (level: string) => {
    switch(level) {
      case 'HIGH':
        return {
          bg: 'bg-red-50',
          text: 'text-red-800',
          border: 'border-red-200',
          icon: AlertTriangle,
          label: 'High Attention Required'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-800',
          border: 'border-amber-200',
          icon: AlertCircle,
          label: 'Moderate Attention'
        };
      case 'LOW':
        return {
          bg: 'bg-green-50',
          text: 'text-green-800',
          border: 'border-green-200',
          icon: CheckCircle,
          label: 'Low Attention'
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-800',
          border: 'border-gray-200',
          icon: CheckCircle,
          label: 'Unknown'
        };
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch(severity) {
      case 'HIGH': return { bg: 'bg-red-100', text: 'text-red-800', label: 'High' };
      case 'MEDIUM': return { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Medium' };
      case 'LOW': return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Low' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-800', label: severity };
    }
  };

  const getImpactConfig = (impact: string) => {
    switch(impact) {
      case 'SIGNIFICANT': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Significant' };
      case 'MODERATE': return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'Moderate' };
      case 'MINOR': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Minor' };
      default: return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: impact };
    }
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

  if (!formattedSummary) {
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

  const attentionConfig = getAttentionLevelConfig(formattedSummary.attentionLevel);
  const AttentionIcon = attentionConfig.icon;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6" id="ai-summary-content">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#0D1B3E] flex items-center gap-2">
            <span className="text-blue-600">AI Support</span>
            <span className="text-gray-400">–</span>
            <span>Patient Summary</span>
            {isLegacyFormat && (
              <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                Legacy Format
              </span>
            )}
          </h2>
          {formattedSummary.generatedAt && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <Clock className="w-3 h-3" />
              <span>Updated: {new Date(formattedSummary.generatedAt).toLocaleString()}</span>
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

      {/* Attention Level Banner */}
      <div className={`${attentionConfig.bg} ${attentionConfig.border} border rounded-lg p-4 mb-6`}>
        <div className="flex items-center gap-3">
          <AttentionIcon className={`w-6 h-6 ${attentionConfig.text}`} />
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-bold ${attentionConfig.text}`}>Attention Level</h3>
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${attentionConfig.bg} ${attentionConfig.text} border ${attentionConfig.border}`}>
                {attentionConfig.label}
              </span>
            </div>
            <p className="text-sm text-gray-700 mt-1">
              Based on analysis of treatment history and data quality
            </p>
          </div>
        </div>
      </div>


      {/* Legacy Format Display (if using old API) */}
      {isLegacyFormat && summary && (
        <div className="space-y-6">
          <section className="border-b border-gray-200 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Overview</h3>
            </div>
            <p className="text-gray-700 leading-relaxed pl-7">{summary.overview}</p>
          </section>

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

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Stethoscope className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800">Recent Treatments</h3>
            </div>
            <p className="text-gray-700 leading-relaxed pl-7">{summary.recentTreatments}</p>
          </section>
        </div>
      )}

      {/* Enhanced Format Display (if using new API) */}
      {!isLegacyFormat && formattedSummary && (
        <div className="space-y-6">
          {/* Overview Section */}
          <section className="border-b border-gray-200 pb-5">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Overview</h3>
            </div>
            <p className="text-gray-700 leading-relaxed pl-7">{formattedSummary.overview}</p>
          </section>

          {/* Data Quality Issues */}
          <section className="border-b border-gray-200 pb-5">
            <button
              onClick={() => toggleSection('dataQuality')}
              className="flex items-center justify-between w-full mb-3 hover:bg-gray-50 p-1 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <FileWarning className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-gray-800">Data Quality Issues</h3>
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                  {formattedSummary.dataQualityIssues.length}
                </span>
              </div>
              {expandedSections.dataQuality ? 
                <ChevronDown className="w-5 h-5 text-gray-400" /> : 
                <ChevronRight className="w-5 h-5 text-gray-400" />
              }
            </button>
            
            {expandedSections.dataQuality && (
              <div className="space-y-3 pl-7">
                {formattedSummary.dataQualityIssues.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                    <p>No data quality issues detected</p>
                  </div>
                ) : (
                  formattedSummary.dataQualityIssues.map((issue, index) => {
                    const severityConfig = getSeverityConfig(issue.severity);
                    return (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-gray-800 font-medium">{issue.issue}</p>
                          <span className={`px-2 py-1 text-xs font-bold rounded-full ${severityConfig.bg} ${severityConfig.text}`}>
                            {severityConfig.label}
                          </span>
                        </div>
                        <div className="bg-white rounded p-3 mt-2 border border-gray-100">
                          <p className="text-sm text-gray-600 font-medium mb-1">Suggestion:</p>
                          <p className="text-sm text-gray-700">{issue.suggestion}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </section>

          {/* Risk Factors */}
          <section className="border-b border-gray-200 pb-5">
            <button
              onClick={() => toggleSection('riskFactors')}
              className="flex items-center justify-between w-full mb-3 hover:bg-gray-50 p-1 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-800">Risk Factors</h3>
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                  {formattedSummary.riskFactors.length}
                </span>
              </div>
              {expandedSections.riskFactors ? 
                <ChevronDown className="w-5 h-5 text-gray-400" /> : 
                <ChevronRight className="w-5 h-5 text-gray-400" />
              }
            </button>
            
            {expandedSections.riskFactors && (
              <div className="space-y-3 pl-7">
                {formattedSummary.riskFactors.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                    <p>No significant risk factors detected</p>
                  </div>
                ) : (
                  formattedSummary.riskFactors.map((risk, index) => {
                    const impactConfig = getImpactConfig(risk.impact);
                    return (
                      <div key={index} className={`rounded-lg p-4 border ${impactConfig.border} ${impactConfig.bg}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-gray-800">{risk.factor}</p>
                            <p className="text-sm text-gray-600 mt-1">{risk.evidence}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-bold rounded-full ${impactConfig.bg} ${impactConfig.text} border ${impactConfig.border}`}>
                            {impactConfig.label}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </section>

          {/* Advisory Notes */}
          <section className="border-b border-gray-200 pb-5">
            <button
              onClick={() => toggleSection('advisoryNotes')}
              className="flex items-center justify-between w-full mb-3 hover:bg-gray-50 p-1 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-800">Advisory Notes</h3>
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                  {formattedSummary.advisoryNotes.length}
                </span>
              </div>
              {expandedSections.advisoryNotes ? 
                <ChevronDown className="w-5 h-5 text-gray-400" /> : 
                <ChevronRight className="w-5 h-5 text-gray-400" />
              }
            </button>
            
            {expandedSections.advisoryNotes && (
              <div className="space-y-2 pl-7">
                {formattedSummary.advisoryNotes.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    <p>No advisory notes available</p>
                  </div>
                ) : (
                  formattedSummary.advisoryNotes.map((note, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700">{note}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>

          {/* Full Report Section */}
          <section>
            <button
              onClick={() => toggleSection('fullReport')}
              className="flex items-center justify-between w-full mb-3 hover:bg-gray-50 p-1 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-800">Full Report</h3>
              </div>
              {expandedSections.fullReport ? 
                <ChevronDown className="w-5 h-5 text-gray-400" /> : 
                <ChevronRight className="w-5 h-5 text-gray-400" />
              }
            </button>
            
            {expandedSections.fullReport && (
              <div className="pl-7">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {formattedSummary.summaryReport}
                  </p>
                </div>
              </div>
            )}
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

