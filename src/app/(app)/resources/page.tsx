
'use client';
import { useState, useEffect } from 'react';
import type { ResourceLink } from '@/types';
import { mockResourceLinks, mockSkills, mockCareerGoals, mockTimelineEvents } from '@/data/mock';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, LinkIcon, PlusCircle, Bot, ExternalLink, Trash2, Edit3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { suggestResources } from '@/ai/flows/suggest-resources';
import type { SuggestResourcesInput } from '@/ai/flows/suggest-resources';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


export default function ResourcesPage() {
  const [bookmarkedResources, setBookmarkedResources] = useState<ResourceLink[]>(mockResourceLinks);
  const [aiSuggestedResources, setAiSuggestedResources] = useState<ResourceLink[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const { toast } = useToast();

  const fetchAiSuggestions = async () => {
    if (process.env.NEXT_PUBLIC_IS_STATIC_EXPORT) {
      toast({
        title: 'Feature Unavailable',
        description: 'AI features are disabled in this static version of the app.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const userInput: SuggestResourcesInput = {
        trackedSkills: mockSkills.map(skill => skill.name),
        careerGoals: mockCareerGoals.map(goal => goal.title).join(', '),
        timelineEvents: mockTimelineEvents.map(event => `${event.title} on ${event.date.toDateString()}`).join('; '),
      };
      const result = await suggestResources(userInput);
      
      const newSuggestions: ResourceLink[] = result.suggestedResources.map((res, index) => {
        // Try to parse title and URL if formatted like "Title (URL)" or "Title: URL"
        let title = res;
        let url = '#'; // Default URL
        const urlMatch = res.match(/\((https?:\/\/[^\s)]+)\)/) || res.match(/:\s*(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          url = urlMatch[1];
          title = res.replace(urlMatch[0], '').trim();
        }
        
        return {
          id: `ai-${Date.now()}-${index}`,
          title,
          url,
          description: result.reasoning.split('\n')[index] || "AI Recommended Resource", // Basic split for reasoning
          category: 'website', // Default category, can be improved
          isAIRec_om_mended: true,
        };
      });
      setAiSuggestedResources(newSuggestions);
      if(newSuggestions.length === 0) {
        toast({ title: "AI Suggestions", description: "No new suggestions found at this time, or AI could not parse them." });
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      toast({ title: "Error", description: "Failed to fetch AI suggestions.", variant: "destructive" });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    // Optionally fetch suggestions on load
    // fetchAiSuggestions(); 
  }, []);

  const allResources = [...bookmarkedResources, ...aiSuggestedResources];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex-1">
          <h1 className="font-headline text-3xl font-semibold text-primary">Learning Resources</h1>
          <p className="text-foreground/80 mt-1">
            Curate your learning materials and discover AI-powered suggestions.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <PlusCircle className="mr-2 h-5 w-5" /> Add Bookmark
          </Button>
          <Button onClick={fetchAiSuggestions} disabled={isLoadingSuggestions} variant="outline">
            {isLoadingSuggestions ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Bot className="mr-2 h-5 w-5" />
            )}
            Get AI Suggestions
          </Button>
        </div>
      </div>

      {allResources.length === 0 && !isLoadingSuggestions && (
        <Card className="frosted-glass text-center p-8">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary">No Resources Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/70 mb-4">Start by adding your own bookmarks or get suggestions from our AI.</p>
            <Lightbulb className="h-12 w-12 text-accent mx-auto" />
          </CardContent>
        </Card>
      )}

      {isLoadingSuggestions && allResources.length === 0 && (
         <div className="flex items-center justify-center p-8"><LoadingSpinner size="lg" /></div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {allResources.map((resource) => (
          <Card key={resource.id} className="frosted-glass shadow-lg flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="font-headline text-lg text-primary flex items-center">
                  {resource.isAIRec_om_mended ? 
                    <Bot className="mr-2 h-5 w-5 text-accent flex-shrink-0" /> : 
                    <LinkIcon className="mr-2 h-5 w-5 text-accent flex-shrink-0" />
                  }
                  <a href={resource.url} target="_blank" rel="noopener noreferrer" className="hover:underline line-clamp-2">
                    {resource.title}
                  </a>
                </CardTitle>
                {!resource.isAIRec_om_mended && (
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="frosted-glass">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this resource.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => { /* Implement delete logic */ }}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
                )}
              </div>
              <CardDescription className="text-xs text-muted-foreground flex items-center gap-2">
                <Badge variant={resource.isAIRec_om_mended ? "default" : "secondary"} className={resource.isAIRec_om_mended ? "bg-primary/80 text-primary-foreground" : ""}>
                  {resource.isAIRec_om_mended ? 'AI Suggested' : 'Bookmarked'}
                </Badge>
                 <Badge variant="outline">{resource.category}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              {resource.description && <p className="text-sm text-foreground/80 line-clamp-3">{resource.description}</p>}
            </CardContent>
            <CardContent className="pt-0">
               <a href={resource.url} target="_blank" rel="noopener noreferrer" className="w-full">
                <Button variant="outline" size="sm" className="w-full">
                  Visit Resource <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
