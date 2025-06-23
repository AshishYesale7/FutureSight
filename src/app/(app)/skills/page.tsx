
'use client';
import { useState, useEffect } from 'react';
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
import EditSkillModal from '@/components/skills/EditSkillModal';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { getSkills, saveSkill, deleteSkill } from '@/services/skillsService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const proficiencyColors: Record<Skill['proficiency'], string> = {
  Beginner: 'bg-blue-500/80 border-blue-700 text-white',
  Intermediate: 'bg-yellow-500/80 border-yellow-700 text-yellow-900',
  Advanced: 'bg-green-500/80 border-green-700 text-white',
  Expert: 'bg-purple-500/80 border-purple-700 text-white',
};

const SKILLS_STORAGE_KEY = 'futureSightSkills';

export default function SkillsPage() {
  const { user } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const { toast } = useToast();

  const syncToLocalStorage = (data: Skill[]) => {
    try {
      const serializableSkills = data.map(s => ({...s, lastUpdated: s.lastUpdated.toISOString() }));
      localStorage.setItem(SKILLS_STORAGE_KEY, JSON.stringify(serializableSkills));
    } catch (error) {
      console.error("Failed to save skills to local storage", error);
    }
  };

  const loadFromLocalStorage = (): Skill[] => {
    try {
      const storedSkills = localStorage.getItem(SKILLS_STORAGE_KEY);
      if (storedSkills) {
        const parsedSkills: (Omit<Skill, 'lastUpdated'> & { lastUpdated?: string })[] = JSON.parse(storedSkills);
        return parsedSkills.map(s => ({...s, lastUpdated: s.lastUpdated ? new Date(s.lastUpdated) : new Date() }));
      }
    } catch (error) {
      console.error("Failed to load skills from local storage", error);
    }
    return mockSkills;
  };

  useEffect(() => {
    const loadSkills = async () => {
      setIsLoading(true);
      if (user) {
        try {
          const firestoreSkills = await getSkills(user.uid);
          setSkills(firestoreSkills);
          syncToLocalStorage(firestoreSkills);
        } catch (error) {
          console.error("Failed to fetch skills from Firestore, loading from local storage.", error);
          setSkills(loadFromLocalStorage());
          toast({ title: "Offline Mode", description: "Could not connect to the server. Displaying locally saved skills.", variant: "destructive"});
        }
      } else {
        setSkills(loadFromLocalStorage());
      }
      setIsLoading(false);
    };

    loadSkills();
  }, [user]);

  const handleOpenModal = (skill: Skill | null) => {
    setEditingSkill(skill);
    setIsModalOpen(true);
  };

  const handleDeleteSkill = async (skillId: string) => {
    const originalSkills = skills;
    const newSkills = skills.filter(skill => skill.id !== skillId);
    setSkills(newSkills); // Optimistic update

    toast({ title: "Skill Deleted", description: "The skill has been successfully removed." });
    syncToLocalStorage(newSkills);

    if (user) {
      try {
        await deleteSkill(user.uid, skillId);
      } catch (error) {
        console.error("Failed to delete skill from Firestore", error);
        setSkills(originalSkills); // Revert
        syncToLocalStorage(originalSkills);
        toast({ title: "Error", description: "Failed to delete skill from the server. Please try again.", variant: "destructive" });
      }
    }
  };

  const handleSaveSkill = async (skillToSave: Skill) => {
    const now = new Date();
    const skillWithDate = { ...skillToSave, lastUpdated: now };
    
    const originalSkills = skills;
    const skillExists = skills.some(s => s.id === skillWithDate.id);
    let newSkills: Skill[];
    
    if (skillExists) {
      newSkills = skills.map(s => s.id === skillWithDate.id ? skillWithDate : s);
      toast({ title: "Skill Updated", description: "Your skill has been successfully updated." });
    } else {
      newSkills = [...skills, skillWithDate];
      toast({ title: "Skill Added", description: "A new skill has been successfully added." });
    }

    setSkills(newSkills);
    setIsModalOpen(false);
    setEditingSkill(null);
    syncToLocalStorage(newSkills);
    
    if (user) {
      try {
        await saveSkill(user.uid, skillWithDate);
      } catch (error) {
        console.error("Failed to save skill to Firestore", error);
        setSkills(originalSkills); // Revert
        syncToLocalStorage(originalSkills);
        toast({ title: "Error", description: "Failed to save skill to the server. Your changes have been saved locally.", variant: "destructive" });
      }
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-headline text-3xl font-semibold text-primary">Skills Tracker</h1>
        <Button onClick={() => handleOpenModal(null)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
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
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenModal(skill)}>
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
                          onClick={() => handleDeleteSkill(skill.id)}
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
                <Badge className={proficiencyColors[skill.proficiency]}>{skill.proficiency}</Badge>
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
       <EditSkillModal 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        skillToEdit={editingSkill}
        onSave={handleSaveSkill}
      />
    </div>
  );
}
