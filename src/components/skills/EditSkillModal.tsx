
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Skill } from "@/types";
import { useEffect } from "react";

const skillCategories: Skill['category'][] = ['DSA', 'OS', 'DBMS', 'AI', 'WebDev', 'MobileDev', 'Other'];
const skillProficiencies: Skill['proficiency'][] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

const skillFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  category: z.enum(skillCategories, { required_error: "Category is required." }),
  proficiency: z.enum(skillProficiencies, { required_error: "Proficiency is required." }),
});

type SkillFormValues = z.infer<typeof skillFormSchema>;

interface EditSkillModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  skillToEdit: Skill | null;
  onSave: (skill: Skill) => void;
}

export default function EditSkillModal({ isOpen, onOpenChange, skillToEdit, onSave }: EditSkillModalProps) {
  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: {
      name: '',
      category: 'Other',
      proficiency: 'Beginner',
    },
  });

  useEffect(() => {
    if (skillToEdit) {
      form.reset({
        name: skillToEdit.name,
        category: skillToEdit.category,
        proficiency: skillToEdit.proficiency,
      });
    } else {
      form.reset({
        name: '',
        category: 'Other',
        proficiency: 'Beginner',
      });
    }
  }, [skillToEdit, form, isOpen]);

  const handleSubmit = (values: SkillFormValues) => {
    const skillData: Skill = {
      id: skillToEdit?.id || `skill-${Date.now()}`,
      ...values,
      lastUpdated: new Date(), // This will be overwritten by the parent, but good to have
    };
    onSave(skillData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg frosted-glass p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border/30">
          <DialogTitle className="font-headline text-xl text-primary">{skillToEdit ? 'Edit Skill' : 'Add New Skill'}</DialogTitle>
          <DialogDescription>
            {skillToEdit ? "Update the details of your skill." : "Add a new skill to your tracker."}
          </DialogDescription>
        </DialogHeader>
        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., React" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {skillCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="proficiency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proficiency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a proficiency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {skillProficiencies.map(prof => (
                            <SelectItem key={prof} value={prof}>{prof}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">Save Skill</Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
