import Link from 'next/link';
import { LoginForm } from '@/features/auth/login-form';
import { Section } from '@/components/section';

export default function LoginPage() {
  return (
    <Section subtitle="Autentificare prin email magic link via Supabase." title="Login">
      <LoginForm />
      <p className="text-xs text-gray-600">
        Prin autentificare accepți Termenii și Politica de confidențialitate (vezi pagina Info).
      </p>
      <Link className="text-sm font-semibold text-primary" href="/">
        Înapoi la Home
      </Link>
    </Section>
  );
}
