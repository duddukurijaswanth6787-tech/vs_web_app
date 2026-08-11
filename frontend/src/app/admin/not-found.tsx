import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';

export default function AdminNotFound() {
  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4 text-center px-4">
      <FileQuestion className="h-16 w-16 text-neutral-300" />
      <div>
        <h2 className="text-2xl font-bold text-neutral-800">Page not found</h2>
        <p className="text-sm text-neutral-500 mt-1 max-w-sm">
          The page you are looking for does not exist or may have been moved.
        </p>
      </div>
      <Link
        href="/admin/dashboard"
        className="rounded-md bg-neutral-900 px-4 h-9 flex items-center gap-1.5 text-sm font-medium text-white hover:bg-neutral-800 transition"
      >
        <Home className="h-3.5 w-3.5" />
        Back to Dashboard
      </Link>
    </div>
  );
}
