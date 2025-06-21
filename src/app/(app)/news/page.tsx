
'use client';
import { useState } from 'react';
import type { NewsArticle } from '@/types';
import { mockNewsArticles } from '@/data/mock';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Newspaper, ExternalLink, Bot } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>(mockNewsArticles);
  const [summarizingArticleId, setSummarizingArticleId] = useState<string | null>(null);
  const [summarizedText, setSummarizedText] = useState<string>('');
  const { toast } = useToast();

  const handleSummarize = async (article: NewsArticle) => {
    if (process.env.NEXT_PUBLIC_IS_STATIC_EXPORT) {
      toast({
        title: 'Feature Unavailable',
        description: 'AI features are disabled in this static version of the app.',
        variant: 'destructive',
      });
      return;
    }

    setSummarizingArticleId(article.id);
    setSummarizedText(''); // Clear previous summary
    // Mock AI summarization
    setTimeout(() => {
      setSummarizedText(`AI Summary of "${article.title}": This article discusses key developments related to ${article.title.toLowerCase()}. It highlights significant points such as [mock point 1] and [mock point 2], concluding with an outlook on [mock outlook]. For full details, please read the original article.`);
      setSummarizingArticleId(null);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-semibold text-primary">Career & Exam News</h1>
      <p className="text-foreground/80">
        Stay updated with the latest news and announcements relevant to your career and exam preparation.
      </p>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {articles.map((article) => (
          <Card key={article.id} className="frosted-glass shadow-lg flex flex-col">
            {article.imageUrl && (
              <div className="relative h-48 w-full">
                <Image 
                  src={article.imageUrl} 
                  alt={article.title} 
                  layout="fill" 
                  objectFit="cover" 
                  className="rounded-t-lg"
                  data-ai-hint="technology education" 
                />
              </div>
            )}
            <CardHeader>
              <CardTitle className="font-headline text-xl text-primary">{article.title}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {article.source} - {format(article.publishedDate, 'MMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
              <p className="text-sm text-foreground/80 line-clamp-3">{article.summary}</p>
              {summarizingArticleId === article.id && <div className="flex items-center justify-center p-4"><LoadingSpinner /></div>}
              {summarizedText && articles.find(a => a.id === summarizingArticleId) === undefined && article.id === mockNewsArticles.find(a => a.title === summarizedText.split('"')[1])?.id &&  ( // A bit hacky way to show summary for correct card
                 <div className="mt-2 p-3 bg-primary/5 rounded-md border border-primary/20">
                    <h4 className="text-sm font-semibold text-primary flex items-center mb-1"><Bot className="mr-1 h-4 w-4" /> AI Summary</h4>
                    <p className="text-xs text-foreground/70">{summarizedText}</p>
                 </div>
              )}

            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={() => handleSummarize(article)} disabled={!!summarizingArticleId}>
                <Bot className="mr-2 h-4 w-4" />
                {summarizingArticleId === article.id ? 'Summarizing...' : 'Summarize with AI'}
              </Button>
              <a href={article.url} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="text-accent hover:text-accent/80">
                  Read More <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
