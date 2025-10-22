import { useState } from 'react';
import { fetchProductById, type Product } from '../../../../huybro_api/productApi';

export default function useGetProductById() {
  const [idInput, setIdInput] = useState<string>('');
  const [detail, setDetail] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleLoad = async () => {
    setMsg('');
    setErrorMsg('');
    if (!idInput) {
      setMsg('Please enter an ID');
      return;
    }
    setLoading(true);
    try {
      const data = await fetchProductById(idInput);
      setDetail(data);
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Request failed');
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  return { idInput, setIdInput, detail, loading, msg, errorMsg, handleLoad };
}
