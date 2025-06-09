
'use client';

import SignUpForm from '@/components/auth/SignUpForm';
import AuthGuard from '@/components/AuthGuard';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

export default function SignUpPage() {
  return (
    <ThemeProvider forceDark={true}>
      <AuthGuard requireAuth={false}>
        <div 
          className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden dark"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1477346611705-65d1883cee1e?dpr=0.800000011920929&auto=format&fit=crop&w=1199&h=800&q=80&cs=tinysrgb&crop=)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="w-full max-w-sm">
            <SignUpForm />
          </div>
        </div>
      </AuthGuard>
    </ThemeProvider>
  );
}
