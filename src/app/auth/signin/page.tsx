
import SignInForm from '@/components/auth/SignInForm';
import Image from 'next/image';

export default function SignInPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <Image
        src="https://placehold.co/1920x1080.png"
        alt="Background"
        layout="fill"
        objectFit="cover"
        className="-z-10"
        data-ai-hint="mountains sky"
      />
      <div className="w-full max-w-sm">
        <SignInForm />
      </div>
    </div>
  );
}
