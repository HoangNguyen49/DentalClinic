import React, { useState } from "react";
// ensure React symbol is referenced for environments that inject it
void React;
import axios from "axios";
import { toast } from "react-toastify";

type Props = {
  patientId: number;
  recordId: number;
  fileName?: string;
  openInNewTab?: boolean; // if true, open PDF in new tab instead of download
  onSuccess?: () => void;
  onError?: (error: string) => void;
};

export default function MedicalRecordPdfExporter({
  patientId,
  recordId,
  fileName,
  openInNewTab = false,
  onSuccess,
  onError,
}: Props) {
  const [loading, setLoading] = useState(false);
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const token = localStorage.getItem("accessToken");

  const handleExport = async () => {
    if (!patientId || !recordId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${apiBase}/api/patients/${patientId}/records/${recordId}/export-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "arraybuffer",
        withCredentials: true,
      });

      const arrayBuffer = res.data as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const finalName = fileName || `medical-record-${recordId}.pdf`;

      if (openInNewTab) {
        window.open(url, "_blank");
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = finalName;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }

      // release object URL
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);

      onSuccess?.();
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Failed to export PDF";
      toast.error("Failed to export PDF");
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
    >
      {loading ? "Exporting..." : "Export PDF"}
    </button>
  );
}
