
'use client';
import { useState, useEffect, useMemo } from 'react';
import type { NewsArticle } from '@/types';
import { allMockNewsArticles } from '@/data/mock';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Newspaper, ExternalLink, Bot, Rss, Tags } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { summarizeNews } from '@/ai/flows/summarize-news-flow';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const KEYWORDS_STORAGE_KEY = 'futureSightNewsKeywords';
const ALL_KEYWORDS = ['AI', 'Software Engineering', 'GATE', 'CAT', 'Internships', 'Opportunities', 'Exams', 'Research', 'Skills', 'Google'];

export default function NewsPage() {
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(() => new Set());
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [summarizingArticleId, setSummarizingArticleId] = useState<string | null>(null);
  const [summarizedContent, setSummarizedContent] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedKeywords = localStorage.getItem(KEYWORDS_STORAGE_KEY);
    if (storedKeywords) {
      setSelectedKeywords(new Set(JSON.parse(storedKeywords)));
    } else {
      // Default selection
      setSelectedKeywords(new Set(['AI', 'Internships']));
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(KEYWORDS_STORAGE_KEY, JSON.stringify(Array.from(selectedKeywords)));
      
      if (selectedKeywords.size === 0) {
        setArticles(allMockNewsArticles);
      } else {
        const filteredArticles = allMockNewsArticles.filter(article => 
          article.tags?.some(tag => selectedKeywords.has(tag))
        );
        setArticles(filteredArticles);
      }
    }
  }, [selectedKeywords, isMounted]);

  const handleKeywordToggle = (keyword: string) => {
    setSelectedKeywords(prev => {
      const newKeywords = new Set(prev);
      if (newKeywords.has(keyword)) {
        newKeywords.delete(keyword);
      } else {
        newKeywords.add(keyword);
      }
      return newKeywords;
    });
  };

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
    try {
      const result = await summarizeNews({ title: article.title, content: article.summary });
      setSummarizedContent(prev => ({ ...prev, [article.id]: result.summary }));
    } catch (error) {
      console.error('Error summarizing article:', error);
      toast({
        title: 'Error',
        description: 'Failed to summarize article. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSummarizingArticleId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold text-primary flex items-center">
          <Rss className="mr-3 h-8 w-8 text-accent" />
          Personalized News Feed
        </h1>
        <p className="text-foreground/80 mt-1">
          Stay updated with news tailored to your career and exam interests.
        </p>
      </div>

      <Card className="frosted-glass shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary flex items-center">
            <Tags className="mr-2 h-5 w-5" />
            Filter by Interests
          </CardTitle>
          <CardDescription>
            Select keywords to customize your news feed. Your selections are saved automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {ALL_KEYWORDS.map(keyword => (
            <Badge
              key={keyword}
              variant={selectedKeywords.has(keyword) ? 'default' : 'secondary'}
              onClick={() => handleKeywordToggle(keyword)}
              className={cn(
                "cursor-pointer transition-all text-sm py-1 px-3",
                selectedKeywords.has(keyword) ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'hover:bg-secondary/80'
              )}
            >
              {keyword}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {articles.map((article) => (
          <Card key={article.id} className="frosted-glass shadow-lg flex flex-col">
            {article.imageUrl && (
              <div className="relative h-48 w-full">
                <Image 
                  src={article.imageUrl} 
                  alt={article.title} 
                  fill={true}
                  style={{ objectFit: 'cover' }}
                  className="rounded-t-lg"
                  data-ai-hint="technology education" 
                />
              </div>
            )}
            <CardHeader>
              <CardTitle className="font-headline text-xl text-primary">{article.title}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground flex justify-between items-center">
                <span>{article.source} - {format(article.publishedDate, 'MMM d, yyyy')}</span>
                 <div className="flex gap-1">
                    {article.tags?.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="outline" className="px-1.5 py-0 text-[10px]">{tag}</Badge>
                    ))}
                  </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
              <p className="text-sm text-foreground/80 line-clamp-3">{article.summary}</p>
              {summarizingArticleId === article.id && (
                 <div className="flex items-center space-x-2 text-sm text-primary p-3 bg-primary/5 rounded-md">
                  <LoadingSpinner size="sm" />
                  <span>Generating AI summary...</span>
                </div>
              )}
              {summarizedContent[article.id] && (
                 <div className="mt-2 p-3 bg-primary/5 rounded-md border border-primary/20 animate-in fade-in duration-500">
                    <h4 className="text-sm font-semibold text-primary flex items-center mb-1">
                      <Bot className="mr-2 h-4 w-4 flex-shrink-0" /> AI Summary
                    </h4>
                    <p className="text-sm text-foreground/90">{summarizedContent[article.id]}</p>
                 </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between items-center bg-background/20 py-3 px-4 rounded-b-lg">
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
       {articles.length === 0 && isMounted && (
        <Card className="frosted-glass text-center p-8 md:col-span-2">
            <CardHeader>
                <CardTitle className="font-headline text-xl text-primary">No Articles Found</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-foreground/70 mb-4">No articles match your selected keywords. Try selecting different or broader interests.</p>
                <Newspaper className="h-12 w-12 text-accent mx-auto" />
            </CardContent>
        </Card>
       )}
    </div>
  );
}
