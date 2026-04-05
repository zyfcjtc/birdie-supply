import { Link } from "@/i18n/routing";

export default function NotFound() {
  return (
    <div className="py-12 text-center">
      <div className="text-4xl mb-4">404</div>
      <p className="text-gray-500 mb-4">Page not found</p>
      <Link href="/" className="text-emerald-600 font-medium hover:underline">
        Go home
      </Link>
    </div>
  );
}
