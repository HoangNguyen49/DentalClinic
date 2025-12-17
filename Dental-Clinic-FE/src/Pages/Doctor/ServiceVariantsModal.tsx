import { X } from "lucide-react";
import { useState } from "react";

type ServiceVariantDTO = {
  variantId?: number;
  id?: number; // Support both variantId and id for compatibility
  variantName: string;
  description?: string;
  price?: number;
  duration?: number;
  currency?: string;
  isActive?: boolean;
};

type ServiceDTO = {
  id: number;
  serviceName: string;
  category?: string;
  description?: string;
  defaultDuration?: number;
  isActive?: boolean;
  variants?: ServiceVariantDTO[];
};

type Props = {
  isOpen: boolean;
  service: ServiceDTO | null;
  onClose: () => void;
  // If provided, highlight a specific variant by id or name
  activeVariantId?: number | null;
  activeVariantName?: string | null;
  // If true, limit the shown variants to only the active one (if provided)
  onlyShowActiveVariant?: boolean;
};

export default function ServiceVariantsModal({ isOpen, service, onClose, activeVariantId, activeVariantName, onlyShowActiveVariant }: Props) {
  if (!isOpen || !service) return null;

  const variants = service.variants || [];
  const [showAllVariants, setShowAllVariants] = useState<boolean>(!onlyShowActiveVariant);
  const activeName = activeVariantName;
  const activeId = activeVariantId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4 sticky top-0 bg-white z-10">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400">Service Details</p>
            <h2 className="text-2xl font-bold text-[#0D1B3E]">{service.serviceName}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Service Information */}
          <section className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <h3 className="text-sm font-semibold text-blue-700 mb-3">Service Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {service.category && (
                <div>
                  <span className="font-medium text-blue-600">Category:</span>{" "}
                  <span className="text-blue-900">{service.category}</span>
                </div>
              )}
              {service.defaultDuration && (
                <div>
                  <span className="font-medium text-blue-600">Default Duration:</span>{" "}
                  <span className="text-blue-900">{service.defaultDuration} minutes</span>
                </div>
              )}
              {service.description && (
                <div className="md:col-span-2">
                  <span className="font-medium text-blue-600">Description:</span>{" "}
                  <span className="text-blue-900">{service.description}</span>
                </div>
              )}
            </div>
          </section>

          {/* Service Variants */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Service Variants {variants.length > 0 && `(${variants.length})`}
            </h3>
            {variants.length === 0 ? (
              <div className="rounded-lg border bg-gray-50 p-6 text-center text-gray-500">
                No variants available for this service.
              </div>
            ) : (
              <div className="space-y-3">
                {onlyShowActiveVariant && !showAllVariants && (
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs text-gray-500">Showing selected variant only</div>
                    <button
                      className="text-sm text-blue-600 hover:underline"
                      onClick={() => setShowAllVariants(true)}
                    >
                      View all variants
                    </button>
                  </div>
                )}
                {variants
                  .filter((v) => v.isActive !== false) // Only show active variants
                  .filter((v) => {
                    if (!onlyShowActiveVariant) return true;
                    if (showAllVariants) return true;
                    const vid = v.variantId ?? v.id ?? null;
                    if (activeId && vid === activeId) return true;
                    if (!activeId && activeName && v.variantName === activeName) return true;
                    return false;
                  })
                  .map((variant) => {
                    const variantKey = variant.variantId ?? variant.id ?? 0;
                    const isSelected = (activeVariantId && variantKey === activeVariantId) || (!activeVariantId && activeVariantName && variant.variantName === activeVariantName);
                    return (
                  <div
                    key={variantKey}
                    className={`rounded-xl border p-4 shadow-sm hover:shadow-md transition ${isSelected ? 'border-blue-300 bg-blue-50' : 'bg-white'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-900">
                          {variant.variantName}
                        </h4>
                        {variant.description && (
                          <p className="mt-2 text-sm text-gray-600">{variant.description}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                          {variant.duration && (
                            <span>Duration: {variant.duration} min</span>
                          )}
                          {variant.currency && (
                            <span>Currency: {variant.currency}</span>
                          )}
                        </div>
                      </div>
                      {variant.price !== undefined && variant.price !== null && (
                        <div className="ml-4 text-right">
                          <p className="text-lg font-bold text-blue-600">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: variant.currency || "VND",
                            }).format(variant.price)}
                          </p>
                        </div>
                      )}
                      {isSelected && (
                        <div className="ml-4 text-right flex items-center">
                          <span className="px-2 py-1 rounded bg-blue-700 text-white text-xs font-semibold">Selected</span>
                        </div>
                      )}
                    </div>
                  </div>
                );})}
              </div>
            )}
          </section>
        </div>

        <div className="flex justify-end border-t px-6 py-4 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="rounded border px-4 py-2 text-gray-600 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

