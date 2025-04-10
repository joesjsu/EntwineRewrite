import { SignupForm } from '@/app/auth/components/SignupForm'; // Use correct path alias

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <SignupForm />
    </div>
  );
}