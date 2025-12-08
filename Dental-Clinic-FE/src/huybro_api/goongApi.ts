import axiosClient from "./axiosClient";

// Định nghĩa Type dựa trên Response của BE
export interface GoongPrediction {
  description: string;
  place_id: string;
}

export interface GoongAutocompleteResponse {
  predictions: GoongPrediction[];
  status: string;
}

export interface GoongGeocodeResponse {
  results: { formatted_address: string }[];
  status: string;
}

// API 1: Gợi ý địa chỉ - NÂNG CẤP nhận thêm lat/lng
export async function fetchGoongAutocomplete(
  keyword: string, 
  currentLocation?: { lat: number; lng: number } | null
): Promise<GoongPrediction[]> {
  if (!keyword || keyword.length < 2) return [];
  
  const params: any = { keyword };
  
  // Nếu FE đã lấy được vị trí, gửi kèm để BE bias
  if (currentLocation) {
    params.lat = currentLocation.lat;
    params.lng = currentLocation.lng;
  }

  const res = await axiosClient.get<GoongAutocompleteResponse>("/api/checkout/goongmap/autocomplete", {
    params,
  });
  return res.data.predictions || [];
}

// API 2: Lấy địa chỉ từ tọa độ
export async function fetchGoongGeocode(lat: number, lng: number): Promise<string | null> {
  const res = await axiosClient.get<GoongGeocodeResponse>("/api/checkout/goongmap/geocode", {
    params: { lat, lng },
  });
  if (res.data.results && res.data.results.length > 0) {
    return res.data.results[0].formatted_address;
  }
  return null;
}