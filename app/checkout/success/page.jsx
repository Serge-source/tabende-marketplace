'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function CheckoutSuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get('session_id');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }
    fetch(`/api/payments/session/${sessionId}`)
      .then((r) => r.json()).then(setOrder).finally(() => setLoading(false));
  }, [sessionId]);

  return (
    <div className="section py-20 flex items-center justify-center min-h-[60vh]">
      <div className="card p-10 max-w-md w-full text-center">
        {loading ? (
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        ) : (
          <>
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Payment Confirmed!</h1>
            <p className="text-gray-500 text-sm mb-6">Your order has been placed successfully. The seller has been notified.</p>

            {order && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
                {order.listing && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {order.listing.images?.[0] ? <img src={order.listing.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{order.listing.title}</p>
                      <p className="text-sm font-bold text-blue-600">${order.amount?.toLocaleString()}</p>
                    </div>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200 space-y-1">
                  <div className="flex justify-between text-xs text-gray-500"><span>Order ID</span><span className="font-mono text-gray-700">{order.id?.slice(0, 8).toUpperCase()}</span></div>
                  <div className="flex justify-between text-xs text-gray-500"><span>Status</span><span className="text-emerald-600 font-semibold">Paid</span></div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Link href="/dashboard" className="btn-primary">View My Orders</Link>
              <Link href="/browse" className="btn-secondary">Continue Shopping</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return <Suspense><CheckoutSuccessContent /></Suspense>;
}
