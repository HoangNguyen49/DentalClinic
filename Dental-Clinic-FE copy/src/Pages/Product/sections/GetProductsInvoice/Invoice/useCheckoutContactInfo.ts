import { useEffect, useState } from "react";
import {
  fetchCheckoutContactInfo,
  type CheckoutContactInfoDto,
} from "../../../../../huybro_api/checkoutApi";

export type UseCheckoutContactInfoResult = {
  contact: CheckoutContactInfoDto | null;
  loading: boolean;
  error: string | null;
};

export default function useCheckoutContactInfo(): UseCheckoutContactInfoResult {
  const [contact, setContact] = useState<CheckoutContactInfoDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchCheckoutContactInfo();
        if (!isMounted) return;

        setContact(data);
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message || "Failed to load contact info");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  return { contact, loading, error };
}
