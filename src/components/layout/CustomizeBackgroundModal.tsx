
'use client';

import { useState, type ChangeEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';
import { ImageUp, Link, Trash2, Palette, Slash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomizeBackgroundModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const BACKGROUND_COLORS = [
    { name: 'Default Theme', value: null },
    { name: 'Deep Purple', value: 'hsl(265 35% 8%)' },
    { name: 'Midnight Blue', value: 'hsl(240 30% 10%)' },
    { name: 'Plum', value: 'hsl(300 20% 9%)' },
    { name: 'Charcoal', value: 'hsl(240 5% 12%)' },
];

export default function CustomizeBackgroundModal({ isOpen, onOpenChange }: CustomizeBackgroundModalProps) {
  const { setBackgroundImage, setBackgroundColor, backgroundColor: currentBackgroundColor } = useTheme();
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleUrlApply = () => {
    if (!imageUrl.trim()) {
      toast({ title: 'Error', description: 'Please enter an image URL.', variant: 'destructive' });
      return;
    }
    try {
      // Basic URL validation
      new URL(imageUrl);
      setBackgroundImage(imageUrl);
      toast({ title: 'Success', description: 'Background image updated from URL.' });
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast({ title: 'Error', description: 'Invalid image URL.', variant: 'destructive' });
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: 'Error', description: 'File size exceeds 5MB limit.', variant: 'destructive' });
        setUploadedFile(null);
        setPreviewUrl(null);
        event.target.value = ''; // Clear the input
        return;
      }
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleFileUploadApply = () => {
    if (previewUrl) {
      setBackgroundImage(previewUrl);
      toast({ title: 'Success', description: 'Background image uploaded and applied.' });
      onOpenChange(false);
      resetForm();
    } else {
      toast({ title: 'Error', description: 'No file selected or preview available.', variant: 'destructive' });
    }
  };

  const handleResetBackground = () => {
    setBackgroundImage(null);
    setBackgroundColor(null);
    toast({ title: 'Success', description: 'Background reset to default.' });
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setImageUrl('');
    setUploadedFile(null);
    setPreviewUrl(null);
    // Find the file input and reset its value if it exists
    const fileInput = document.getElementById('background-file-upload') as HTMLInputElement | null;
    if (fileInput) {
      fileInput.value = '';
    }
  };
  
  const handleModalOpenChange = (open: boolean) => {
    if (!open) {
      resetForm(); // Reset form when modal is closed
    }
    onOpenChange(open);
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleModalOpenChange}>
      <DialogContent className="sm:max-w-md frosted-glass p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border/30">
          <DialogTitle className="font-headline text-xl text-primary">Customize Background</DialogTitle>
          <DialogDescription>
            Set a custom background image or color. Your changes are saved automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="flex items-center">
              <Link className="mr-2 h-4 w-4" /> Image URL
            </Label>
            <div className="flex space-x-2">
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <Button onClick={handleUrlApply} variant="outline" className="shrink-0">Apply URL</Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="background-file-upload" className="flex items-center">
              <ImageUp className="mr-2 h-4 w-4" /> Upload Image (Max 5MB)
            </Label>
            <Input
              id="background-file-upload"
              type="file"
              accept="image/png, image/jpeg, image/gif, image/webp"
              onChange={handleFileChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
          </div>

          {previewUrl && (
            <div className="space-y-2">
              <Label>Preview:</Label>
              <img src={previewUrl} alt="Background Preview" className="rounded-md max-h-40 w-auto object-contain border border-border" />
              <Button onClick={handleFileUploadApply} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                Apply Uploaded Image
              </Button>
            </div>
          )}

          <div className="space-y-3">
            <Label className="flex items-center">
                <Palette className="mr-2 h-4 w-4" /> Background Color
            </Label>
            <div className="flex flex-wrap gap-3 pt-1">
                {BACKGROUND_COLORS.map((colorOption) => (
                <button
                    type="button"
                    key={colorOption.name}
                    title={colorOption.name}
                    onClick={() => setBackgroundColor(colorOption.value)}
                    className={cn(
                        "h-8 w-8 rounded-full border-2 transition-all flex items-center justify-center",
                        (currentBackgroundColor === colorOption.value || (!currentBackgroundColor && colorOption.value === null))
                        ? "ring-2 ring-offset-2 ring-offset-background ring-ring"
                        : "hover:scale-110",
                        !colorOption.value && "border-dashed bg-transparent text-muted-foreground"
                    )}
                    style={{ backgroundColor: colorOption.value || 'transparent', borderColor: colorOption.value || 'hsl(var(--border))' }}
                >
                    {!colorOption.value && <Slash className="h-5 w-5" />}
                    <span className="sr-only">{colorOption.name}</span>
                </button>
                ))}
            </div>
          </div>
        </div>
        <DialogFooter className="p-6 pt-4 border-t border-border/30 flex-col sm:flex-row gap-2">
           <Button onClick={handleResetBackground} variant="destructive" className="w-full sm:w-auto mr-auto">
            <Trash2 className="mr-2 h-4 w-4" /> Reset Background
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={resetForm}>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
