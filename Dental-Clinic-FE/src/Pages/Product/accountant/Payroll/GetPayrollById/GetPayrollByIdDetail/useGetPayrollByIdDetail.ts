import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { payrollApi, type PayslipDetailResponse } from "../../../../../../huybro_api/payrollApi";

export const useGetPayrollByIdDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [payslip, setPayslip] = useState<PayslipDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null); 

      try {
        const response = await payrollApi.getPayslipDetail(parseInt(id));
        setPayslip(response.data);
      } catch (err: any) {
        const msg = err.response?.data?.message || "Không thể tải chi tiết phiếu lương.";
        setError(msg);
        console.error("Error fetching payslip:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  return { payslip, loading, error, navigate };
};