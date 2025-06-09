
import SignUpForm from '@/components/auth/SignUpForm';
import Image from 'next/image';

export default function SignUpPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <Image
        src="https://placehold.co/1920x1080.png" 
        alt="Background"
        layout="fill"
        objectFit="cover"
        className="-z-10"
        data-ai-hint="mountains nature"
      />
      <div className="w-full max-w-sm">
        <SignUpForm />
      </div>
    </div>
  );
}
