
'use client';

import { useState, type ChangeEvent, useEffect } from 'react';
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
import { ImageUp, Link, Trash2, Palette, Slash, Paintbrush, Text, Sparkles, Box, Droplets } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ColorPickerPopover } from '../ui/ColorPickerPopover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { GlassEffect } from '@/context/ThemeContext';

interface CustomizeThemeModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const BACKGROUND_COLORS = [
    { name: 'Default', value: null },
    { name: 'Cosmic Fusion', value: 'hsl(255 45% 12%)' },
    { name: 'Oceanic Teal', value: 'hsl(180 50% 15%)' },
    { name: 'Crimson Night', value: 'hsl(340 40% 10%)' },
    { name: 'Royal Amethyst', value: 'hsl(275 35% 14%)' },
    { name: 'Forest Depths', value: 'hsl(150 25% 12%)' },
];

const themeColorConfig = [
  { id: 'background', label: 'Background', icon: Paintbrush, cssVar: '--background' },
  { id: 'foreground', label: 'Foreground Text', icon: Text, cssVar: '--foreground' },
  { id: 'card', label: 'Card Background', icon: Paintbrush, cssVar: '--card' },
  { id: 'primary', label: 'Primary (Headings)', icon: Sparkles, cssVar: '--primary' },
  { id: 'accent', label: 'Accent (Buttons)', icon: Sparkles, cssVar: '--accent' },
];

const glassEffectConfig: {id: GlassEffect, label: string, icon: React.ElementType, description: string}[] = [
    { id: 'frosted', label: 'Frosted Glass', icon: Box, description: 'A classic translucent, blurred effect.' },
    { id: 'water-droplets', label: 'Water Droplets', icon: Droplets, description: 'A textured, dynamic water droplet effect.' },
    { id: 'subtle-shadow', label: 'Subtle Shadow', icon: Box, description: 'A clean look with soft shadows instead of glass.' },
];


export default function CustomizeThemeModal({ isOpen, onOpenChange }: CustomizeThemeModalProps) {
  const { 
    setBackgroundImage, 
    setBackgroundColor, 
    backgroundColor: currentBackgroundColor,
    customTheme,
    setCustomTheme,
    resetCustomizations,
    theme: currentThemeMode,
    isMounted,
    glassEffect,
    setGlassEffect,
    glassEffectSettings,
    setGlassEffectSettings,
  } = useTheme();
  
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [initialThemeValues, setInitialThemeValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && isMounted) {
      const rootStyle = getComputedStyle(document.documentElement);
      const initialValues: Record<string, string> = {};
      themeColorConfig.forEach(config => {
        initialValues[config.cssVar] = rootStyle.getPropertyValue(config.cssVar).trim();
      });
      setInitialThemeValues(initialValues);
    }
  }, [isOpen, isMounted, currentThemeMode]);

  const handleUrlApply = () => {
    if (!imageUrl.trim()) {
      toast({ title: 'Error', description: 'Please enter an image URL.', variant: 'destructive' });
      return;
    }
    try {
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
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Error', description: 'File size exceeds 5MB limit.', variant: 'destructive' });
        return;
      }
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFileUploadApply = () => {
    if (previewUrl) {
      setBackgroundImage(previewUrl);
      toast({ title: 'Success', description: 'Background image uploaded.' });
      onOpenChange(false);
      resetForm();
    }
  };

  const handleReset = () => {
    resetCustomizations();
    toast({ title: 'Success', description: 'All customizations have been reset to default.' });
    onOpenChange(false);
    resetForm();
  };

  const handleColorChange = (cssVar: string, colorString: string) => {
    setCustomTheme({
      ...customTheme,
      [cssVar]: colorString,
    });
  };

  const getCurrentColor = (cssVar: string): string => {
    if (customTheme && customTheme[cssVar]) {
      return customTheme[cssVar];
    }
    return initialThemeValues[cssVar] || '#000000';
  };

  const resetForm = () => {
    setImageUrl('');
    setUploadedFile(null);
    setPreviewUrl(null);
    const fileInput = document.getElementById('background-file-upload') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';
  };
  
  const handleModalOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalOpenChange}>
      <DialogContent className="sm:max-w-lg frosted-glass p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border/30">
          <DialogTitle className="font-headline text-xl text-primary">Customize Theme</DialogTitle>
          <DialogDescription>
            Personalize your app's appearance. Changes are saved automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
              <Label className="font-semibold text-lg flex items-center text-primary">
                  <Droplets className="mr-2 h-5 w-5" /> Glass & Card Style
              </Label>
              <RadioGroup 
                  value={glassEffect} 
                  onValueChange={(value) => setGlassEffect(value as GlassEffect)}
                  className="space-y-1"
              >
                  {glassEffectConfig.map(effect => (
                      <Label key={effect.id} htmlFor={effect.id} className="flex items-center space-x-3 p-3 rounded-lg border border-transparent has-[[data-state=checked]]:border-accent has-[[data-state=checked]]:bg-accent/10 hover:bg-muted/50 cursor-pointer transition-colors">
                          <RadioGroupItem value={effect.id} id={effect.id} />
                          <div className="flex-1">
                              <p className="font-medium flex items-center">{effect.label}</p>
                              <p className="text-xs text-muted-foreground">{effect.description}</p>
                          </div>
                      </Label>
                  ))}
              </RadioGroup>
          </div>

          <Separator />

          {/* Theme Color Customization */}
          <div className="space-y-4">
             <Label className="font-semibold text-lg flex items-center text-primary">
                <Palette className="mr-2 h-5 w-5" /> Theme Colors
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {themeColorConfig.map(config => (
                <div key={config.id} className="flex items-center justify-between">
                  <Label htmlFor={`color-${config.id}`} className="flex items-center gap-2 text-sm">
                    <config.icon className="h-4 w-4 text-muted-foreground" />
                    {config.label}
                  </Label>
                  <ColorPickerPopover 
                    id={`color-${config.id}`}
                    value={getCurrentColor(config.cssVar)} 
                    onChange={(colorString) => handleColorChange(config.cssVar, colorString)} 
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />
          
          {/* Background Customization */}
          <div className="space-y-4">
            <Label className="font-semibold text-lg flex items-center text-primary">
              <ImageUp className="mr-2 h-5 w-5" /> Background Image
            </Label>
            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="text-sm flex items-center">
                <Link className="mr-2 h-4 w-4" /> Image URL
              </Label>
              <div className="flex space-x-2">
                <Input id="imageUrl" type="url" placeholder="https://example.com/image.jpg" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                <Button onClick={handleUrlApply} variant="outline" className="shrink-0">Apply URL</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="background-file-upload" className="text-sm flex items-center">
                <ImageUp className="mr-2 h-4 w-4" /> Upload Image (Max 5MB)
              </Label>
              <Input id="background-file-upload" type="file" accept="image/*" onChange={handleFileChange} />
            </div>
            {previewUrl && (
              <div className="space-y-2">
                <Label>Preview:</Label>
                <img src={previewUrl} alt="Background Preview" className="rounded-md max-h-40 w-auto object-contain border border-border" />
                <Button onClick={handleFileUploadApply} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">Apply Uploaded Image</Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Solid Color Background */}
           <div className="space-y-3">
            <Label className="font-semibold text-lg flex items-center text-primary">
                <Paintbrush className="mr-2 h-5 w-5" /> Solid Background Color
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
           <Button onClick={handleReset} variant="destructive" className="w-full sm:w-auto mr-auto">
            <Trash2 className="mr-2 h-4 w-4" /> Reset All Customizations
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
