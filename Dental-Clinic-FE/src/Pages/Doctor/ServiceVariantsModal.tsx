import { X } from "lucide-react";

type ServiceVariantDTO = {
  id: number;
  variantName: string;
  description?: string;
  price?: number;
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
};

export default function ServiceVariantsModal({ isOpen, service, onClose }: Props) {
  if (!isOpen || !service) return null;

  const variants = service.variants || [];

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
                {variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-900">
                          {variant.variantName}
                        </h4>
                        {variant.description && (
                          <p className="mt-2 text-sm text-gray-600">{variant.description}</p>
                        )}
                      </div>
                      {variant.price !== undefined && variant.price !== null && (
                        <div className="ml-4 text-right">
                          <p className="text-lg font-bold text-blue-600">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(variant.price)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
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

