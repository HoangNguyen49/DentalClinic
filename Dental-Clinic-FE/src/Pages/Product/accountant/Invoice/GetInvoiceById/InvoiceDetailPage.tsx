import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useInvoiceDetail } from "./useInvoiceDetail";
import { 
  ArrowLeft, CheckCircle2, Lock, ShieldCheck, 
  MapPin, Phone, User, Package, CreditCard, Info, AlertCircle 
} from "lucide-react"; 
import { formatMoney } from "../../../../../utils/format";
const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { invoice, loading, error, isUpdating, updateStatus } = useInvoiceDetail(id);

  if (loading) return <div className="py-20 text-center text-gray-500">Loading details...</div>;
  if (!invoice) return <div className="py-20 text-center text-red-500">{error || "Invoice not found"}</div>;

  // Xác định trạng thái để lock giao diện
  const isOrderLocked = ['COMPLETED', 'CANCELLED'].includes(invoice.invoiceStatus);

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        
        {/* BACK BUTTON */}
        <button 
          onClick={() => navigate(-1)} 
          className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to List
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ================= LEFT COLUMN (INFO) ================= */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. GENERAL & CUSTOMER INFO CARD */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">#{invoice.invoiceCode}</h1>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    {invoice.invoiceDate}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 uppercase tracking-wide
                  ${invoice.invoiceStatus === 'NEW' ? 'bg-blue-50 text-blue-700 border-blue-100' : ''}
                  ${invoice.invoiceStatus === 'CONFIRMED' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : ''}
                  ${invoice.invoiceStatus === 'PROCESSING' ? 'bg-purple-50 text-purple-700 border-purple-100' : ''}
                  ${invoice.invoiceStatus === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-100' : ''}
                  ${invoice.invoiceStatus === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-100' : ''}
                `}>
                  {invoice.invoiceStatus}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Customer */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                    <User className="w-3 h-3" /> Customer Details
                  </h3>
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">{invoice.customerFullName}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Phone className="w-3 h-3" /> {invoice.customerPhone}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <CreditCard className="w-3 h-3" /> {invoice.paymentMethod}
                    </p>
                  </div>
                </div>

                {/* Shipping */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> Shipping Address
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {invoice.shippingAddress}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. ORDER ITEMS CARD */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  <h3 className="font-bold text-gray-700 text-sm uppercase">Order Items</h3>
               </div>
               
               <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-3">Product</th>
                      <th className="px-6 py-3 text-center">Qty</th>
                      <th className="px-6 py-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoice.items.map(item => (
                      <tr key={item.invoiceItemId}>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 text-sm">{item.productNameSnapshot}</div>
                          <div className="text-xs text-gray-400 font-mono mt-0.5">{item.skuSnapshot}</div>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-600 font-medium">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900 text-sm">
                          {formatMoney(item.lineTotalAmount, invoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
               
               <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end items-center gap-4">
                  <span className="text-sm text-gray-500 uppercase font-bold">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-600">
                     {formatMoney(invoice.totalAmount, invoice.currency)}
                  </span>
               </div>
            </div>

            {/* 3. NOTES CARD */}
             <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Order Notes</h3>
                <p className="text-sm text-gray-600 italic">
                  {invoice.notes || "No additional notes provided."}
                </p>
             </div>

          </div>

          {/* ================= RIGHT COLUMN (ACTIONS) - BASED ON IMPORT STOCK MODAL ================= */}
          <div className="lg:col-span-1 space-y-6">
             
             {/* Dynamic Lock Layout similar to Pricing Config */}
             <div className={`rounded-xl border shadow-sm h-fit transition-all duration-300 
                ${isOrderLocked ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-100 ring-1 ring-blue-50'}`}>
                
                {/* Header Actions */}
                <div className={`px-5 py-4 border-b flex items-center justify-between 
                   ${isOrderLocked ? 'border-gray-200 bg-gray-100/50' : 'border-blue-100 bg-blue-50/50'}`}>
                    <h3 className={`font-bold text-sm uppercase tracking-wide flex items-center gap-2 
                       ${isOrderLocked ? 'text-gray-500' : 'text-blue-700'}`}>
                        {isOrderLocked ? <Lock className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        Process Order
                    </h3>
                    {isOrderLocked && (
                        <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-1 rounded border border-gray-300">
                            CLOSED
                        </span>
                    )}
                </div>

                <div className="p-5 space-y-5">
                   
                   {/* Notification Bar */}
                   {isOrderLocked ? (
                      <div className="bg-gray-100 text-gray-600 px-3 py-2 rounded text-xs flex items-start gap-2 border border-gray-200">
                          <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>
                              <b>Order is {invoice.invoiceStatus}.</b> <br/>
                              No further actions can be taken on this invoice.
                          </span>
                      </div>
                   ) : (
                      <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded text-xs flex items-start gap-2 border border-blue-100">
                          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>
                              <b>Action Required.</b> <br/>
                              Please review the details and move the order to the next stage.
                          </span>
                      </div>
                   )}

                   {/* CURRENT STATUS DISPLAY */}
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
                          Current Stage
                          {isOrderLocked && <Lock className="w-3 h-3" />}
                      </label>
                      <div className={`w-full rounded-lg border px-3 py-2 text-sm font-bold flex items-center gap-2
                          ${isOrderLocked ? 'bg-gray-100 border-gray-300 text-gray-500' : 'bg-white border-blue-200 text-blue-700'}`}>
                          <div className={`w-2 h-2 rounded-full ${isOrderLocked ? 'bg-gray-400' : 'bg-blue-500 animate-pulse'}`}></div>
                          {invoice.invoiceStatus}
                      </div>
                   </div>

                   {/* --- ACTION BUTTONS --- */}
                   {!isOrderLocked && (
                      <div className="space-y-3 pt-2">
                        {/* Flow: NEW -> CONFIRMED */}
                        {invoice.invoiceStatus === 'NEW' && (
                            <>
                              <button 
                                onClick={() => updateStatus('CONFIRMED')}
                                disabled={isUpdating}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                              >
                                {isUpdating ? 'Processing...' : (
                                  <> <CheckCircle2 className="w-4 h-4" /> Confirm Order </>
                                )}
                              </button>
                              
                              <button 
                                onClick={() => updateStatus('CANCELLED', 'Admin Cancelled')}
                                disabled={isUpdating}
                                className="w-full py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-medium rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                              >
                                <AlertCircle className="w-4 h-4" /> Cancel Order
                              </button>
                            </>
                        )}

                        {/* Flow: CONFIRMED -> PROCESSING */}
                        {invoice.invoiceStatus === 'CONFIRMED' && (
                           <button 
                              onClick={() => updateStatus('PROCESSING')}
                              disabled={isUpdating}
                              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-200 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                               {isUpdating ? 'Processing...' : (
                                  <> <Package className="w-4 h-4" /> Start Packing </>
                               )}
                            </button>
                        )}

                        {/* Flow: PROCESSING -> COMPLETED */}
                        {invoice.invoiceStatus === 'PROCESSING' && (
                           <button 
                              onClick={() => updateStatus('COMPLETED')}
                              disabled={isUpdating}
                              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg shadow-green-200 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                               {isUpdating ? 'Processing...' : (
                                  <> <CheckCircle2 className="w-4 h-4" /> Complete Order </>
                               )}
                            </button>
                        )}
                      </div>
                   )}
                   
                   {/* FOOTER NOTE */}
                   {isOrderLocked && invoice.invoiceStatus === 'COMPLETED' && (
                      <div className="p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 border border-green-100 animate-in fade-in">
                          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                          <span className="text-sm font-medium">Order successfully completed.</span>
                      </div>
                   )}
                </div>
             </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default InvoiceDetailPage;