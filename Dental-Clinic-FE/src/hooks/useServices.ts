import { useEffect, useState, useCallback } from "react";
import axios from "axios";

type ServiceVariantDTO = {
  id: number;
  variantName: string;
  description?: string;
  price?: number;
};

export type ServiceDTO = {
  id: number;
  serviceName: string;
  category?: string;
  description?: string;
  defaultDuration?: number;
  isActive?: boolean;
  variants?: ServiceVariantDTO[];
};

export default function useServices() {
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const accessToken = localStorage.getItem("accessToken");

  const [serviceMap, setServiceMap] = useState<Record<number, ServiceDTO>>({});
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get<ServiceDTO[]>(`${apiBase}/api/services`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });
      const map = Object.fromEntries((res.data || []).map((s) => [s.id, s]));
      setServiceMap(map);
    } catch (err) {
      console.warn("Could not fetch services", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase, accessToken]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const fetchById = useCallback(
    async (id: number) => {
      if (!id) return null;
      if (serviceMap[id]) return serviceMap[id];
      try {
        const res = await axios.get<ServiceDTO>(`${apiBase}/api/services/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        });
        setServiceMap((prev) => ({ ...prev, [id]: res.data }));
        return res.data;
      } catch (err) {
        console.warn(`Failed to fetch service ${id}:`, err);
        return null;
      }
    },
    [apiBase, accessToken, serviceMap]
  );

  return { serviceMap, loading, fetchAll, fetchById };
}
