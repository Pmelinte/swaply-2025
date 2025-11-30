import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">Sign In to Swaply</h1>
        <LoginForm />
      </div>
    </main>
  );
}
