'use client';
import { useState } from 'react';
import type { Skill } from '@/types';
import { mockSkills } from '@/data/mock';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, BookOpen, PlusCircle, Edit3, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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

const proficiencyColors: Record<Skill['proficiency'], string> = {
  Beginner: 'bg-blue-500',
  Intermediate: 'bg-yellow-500',
  Advanced: 'bg-green-500',
  Expert: 'bg-purple-500',
};

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>(mockSkills);
  // Add state and functions for CRUD operations later

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-headline text-3xl font-semibold text-primary">Skills Tracker</h1>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Skill
        </Button>
      </div>
      <p className="text-foreground/80">
        Monitor your learning progress across various technical domains.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {skills.map((skill) => (
          <Card key={skill.id} className="frosted-glass shadow-lg">
            <CardHeader>
               <div className="flex justify-between items-start">
                <CardTitle className="font-headline text-xl text-primary flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-accent" /> {skill.name}
                </CardTitle>
                 <div className="flex space-x-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="frosted-glass">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this skill.
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
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Last updated: {formatDistanceToNow(skill.lastUpdated, { addSuffix: true })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground/80">Category:</span>
                <Badge variant="secondary">{skill.category}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground/80">Proficiency:</span>
                <Badge className={`${proficiencyColors[skill.proficiency]} text-white`}>{skill.proficiency}</Badge>
              </div>
              {skill.learningResources && skill.learningResources.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground/80 mb-1">Learning Resources:</h4>
                  <ul className="space-y-1">
                    {skill.learningResources.map(resource => (
                      <li key={resource.url} className="text-xs">
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center">
                          <BookOpen className="mr-1 h-3 w-3" /> {resource.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
