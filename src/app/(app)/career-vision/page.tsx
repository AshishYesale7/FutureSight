'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Eye, Sparkles, Bot } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function CareerVisionPage() {
  const [userInput, setUserInput] = useState('');
  const [visionStatement, setVisionStatement] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateVision = async () => {
    if (!userInput.trim()) return;
    setIsLoading(true);
    // Mock AI interaction
    setTimeout(() => {
      setVisionStatement(`Based on your input about "${userInput}", a potential career vision could be: "To become a leading expert in leveraging AI for sustainable technology solutions, driving innovation and positive global impact." This vision emphasizes your interest in AI and a desire to contribute meaningfully.`);
      setIsLoading(false);
    }, 1500);
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
