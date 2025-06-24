
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Eye, Sparkles, Bot } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { generateCareerVision } from '@/ai/flows/career-vision-flow';
import { useApiKey } from '@/hooks/use-api-key';

export default function CareerVisionPage() {
  const [userInput, setUserInput] = useState('');
  const [visionStatement, setVisionStatement] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { apiKey } = useApiKey();

  const handleGenerateVision = async () => {
    if (!apiKey && process.env.NEXT_PUBLIC_IS_STATIC_EXPORT) {
      toast({
        title: 'Feature Unavailable',
        description: 'AI features are disabled. Please provide an API key in settings to enable them.',
        variant: 'destructive',
      });
      return;
    }

    if (!userInput.trim()) {
        toast({
            title: 'Input Required',
            description: 'Please describe your passions or aspirations first.',
            variant: 'destructive',
        });
        return;
    }
    
    setIsLoading(true);
    setVisionStatement(''); // Clear previous vision
    
    try {
      const result = await generateCareerVision({ aspirations: userInput, apiKey });
      setVisionStatement(result.visionStatement);
    } catch (error) {
      console.error('Error generating career vision:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate career vision. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-semibold text-primary">Career Vision Planner</h1>
      <p className="text-foreground/80">
        Use AI to help you craft a compelling career vision based on your interests, skills, and aspirations.
      </p>

      <Card className="frosted-glass shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary flex items-center">
            <Eye className="mr-2 h-5 w-5 text-accent" /> Your Input
          </CardTitle>
          <CardDescription>
            Describe your passions, what problems you want to solve, or what impact you want to make.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="e.g., I'm passionate about AI and want to solve environmental challenges..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            rows={5}
            className="bg-background/50 focus:bg-background"
          />
          <Button onClick={handleGenerateVision} disabled={isLoading || !userInput.trim()} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" /> Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" /> Generate Vision with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {visionStatement && (
        <Card className="frosted-glass shadow-lg animate-in fade-in duration-500">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary flex items-center">
              <Bot className="mr-2 h-5 w-5 text-accent" /> AI-Assisted Vision Statement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/90 whitespace-pre-wrap">{visionStatement}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
