import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-4xl md:text-5xl font-bold text-center">
        Swaply 2025 – Skeleton OK ✅
      </h1>
      <p className="max-w-xl text-center text-slate-300">
        This is the clean base project generated from the blueprint. From here
        we will implement authentication, items, swaps, AI and payments step by
        step.
      </p>
      <div className="flex gap-4 mt-6">
        <Link
          href="/login"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
        >
          Register
        </Link>
      </div>
    </main>
  );
}
