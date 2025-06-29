'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function SignUpForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      if (!auth) throw new Error("Firebase Auth is not initialized.");
      await createUserWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: 'Success', description: 'Account created successfully. Welcome!' });
      router.push('/');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create account.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      if (!auth) throw new Error("Firebase Auth is not initialized.");
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast({ title: 'Success', description: 'Signed in with Google successfully.' });
      router.push('/');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to sign in with Google.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="frosted-glass p-6 md:p-8">
      <div className="flex justify-center mb-6">
        <Image
          src="https://t4.ftcdn.net/jpg/10/33/68/61/360_F_1033686185_RvraYXkGXH40OtR1nhmmQaIIbQQqHN5m.jpg"
          alt="Logo"
          width={100}
          height={100}
          className="rounded-full border-2 border-white/50 dark:border-white/20 shadow-lg"
          data-ai-hint="abstract logo"
        />
      </div>
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      placeholder="Email" 
                      {...field} 
                      className="bg-transparent text-foreground border-0 border-b-2 border-neutral-500/50 rounded-none px-1 py-2 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus:border-black dark:focus:border-neutral-300 focus-visible:border-black dark:focus-visible:border-neutral-300 placeholder-foreground/60 text-center"
                    />
                  </FormControl>
                  <FormMessage className="text-center" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Password" 
                        {...field} 
                        className="bg-transparent text-foreground border-0 border-b-2 border-neutral-500/50 rounded-none px-1 py-2 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus:border-black dark:focus:border-neutral-300 focus-visible:border-black dark:focus-visible:border-neutral-300 placeholder-foreground/60 text-center"
                      />
                       <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-center" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                     <div className="relative">
                      <Input 
                        type={showConfirmPassword ? "text" : "password"} 
                        placeholder="Confirm Password" 
                        {...field} 
                        className="bg-transparent text-foreground border-0 border-b-2 border-neutral-500/50 rounded-none px-1 py-2 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus:border-black dark:focus:border-neutral-300 focus-visible:border-black dark:focus-visible:border-neutral-300 placeholder-foreground/60 text-center"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-center"/>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-accent/70 hover:bg-accent/80 text-white h-12 text-lg rounded-full border border-white/30" disabled={loading}>
              {loading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
            </Button>
          </form>
        </Form>
        <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                Or continue with
                </span>
            </div>
        </div>
        <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
             <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.63-4.5 1.63-5.42 0-9.82-4.4-9.82-9.82s4.4-9.82 9.82-9.82c3.1 0 5.14 1.25 6.32 2.39l2.44-2.44C20.44 1.89 17.13 0 12.48 0 5.88 0 0 5.88 0 12.48s5.88 12.48 12.48 12.48c6.92 0 12.04-4.82 12.04-12.04 0-.82-.07-1.62-.2-2.4z" fill="currentColor"/></svg>
            Sign up with Google
        </Button>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/signin" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
