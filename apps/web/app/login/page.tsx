import { LoginForm } from '@/app/auth/components/LoginForm'; // Use correct path alias

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}