import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">404</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">The page you are looking for does not exist.</p>
        <Link href="/az" className="text-emerald-600 hover:underline">
          Go to home page
        </Link>
      </div>
    </div>
  );
}