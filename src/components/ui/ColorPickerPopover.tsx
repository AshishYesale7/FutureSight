
'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Paintbrush } from 'lucide-react';
import { SketchPicker, type ColorResult } from 'react-color';

interface ColorPickerPopoverProps {
  id?: string;
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPickerPopover({ id, value, onChange, className }: ColorPickerPopoverProps) {
  
  const handleColorChange = (color: ColorResult) => {
    const { r, g, b, a } = color.rgb;
    onChange(`rgba(${r}, ${g}, ${b}, ${a})`);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn('w-28 justify-start text-left font-normal', className)}
        >
          <div className="flex w-full items-center gap-2">
            <div
              className="h-4 w-4 rounded !bg-center !bg-cover transition-all"
              style={{ background: value }}
            />
            <div className="flex-1 truncate">{value}</div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-0" align="end">
        <SketchPicker color={value} onChangeComplete={handleColorChange} />
      </PopoverContent>
    </Popover>
  );
}
