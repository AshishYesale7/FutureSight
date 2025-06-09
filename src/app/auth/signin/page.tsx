
'use client';

import SignInForm from '@/components/auth/SignInForm';
import AuthGuard from '@/components/AuthGuard';
import Image from 'next/image';

export default function SignInPage() {
  return (
    <AuthGuard requireAuth={false}>
      <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1477346611705-65d1883cee1e?dpr=0.800000011920929&auto=format&fit=crop&w=1199&h=800&q=80&cs=tinysrgb&crop=1477346611705-65d1883cee1e?dpr=0.800000011920929&auto=format&fit=crop&w=1199&h=800&q=80&cs=tinysrgb&crop="
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
    </AuthGuard>
  );
}
