import { useEffect, useState } from 'react';
import { fetchAllProducts, type Product } from '../../../../huybro_api/productApi';

export default function useGetAllProducts() {
  const [list, setList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const data = await fetchAllProducts();
        setList(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setErrorMsg(err?.message ?? 'Request failed');
        setList([]); 
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { list, loading, errorMsg };
}
