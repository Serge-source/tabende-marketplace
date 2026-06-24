import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="section py-24 flex items-center justify-center min-h-[70vh]">
      <div className="text-center max-w-md">
        <div className="text-8xl font-extrabold text-gray-100 select-none mb-2">404</div>
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto -mt-12 mb-5 relative z-10">
          <svg className="h-8 w-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-500 text-sm mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="btn-primary">Go Home</Link>
          <Link href="/browse" className="btn-secondary">Browse Listings</Link>
        </div>
      </div>
    </div>
  );
}
