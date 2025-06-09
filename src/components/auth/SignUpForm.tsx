
'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserWithEmailAndPassword } from 'firebase/auth';
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
      await createUserWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: 'Success', description: 'Account created successfully. Please sign in.' });
      router.push('/auth/signin');
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

  return (
    <Card className="frosted-glass p-6 md:p-8">
      <div className="flex justify-center mb-6">
        <Image
          src="https://placehold.co/100x100.png"
          alt="Logo"
          width={100}
          height={100}
          className="rounded-full"
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
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-12 text-lg" disabled={loading}>
              {loading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
            </Button>
          </form>
        </Form>
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
