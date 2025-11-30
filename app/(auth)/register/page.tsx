import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">Create Your Swaply Account</h1>
        <RegisterForm />
      </div>
    </main>
  );
}
