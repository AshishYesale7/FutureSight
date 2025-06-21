
'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { SketchPicker, type ColorResult } from 'react-color';

interface ColorPickerPopoverProps {
  id?: string;
  value: string; // The full color string, e.g., 'hsl()', 'rgba()'
  onChange: (colorString: string) => void; // Callback with the full rgba string
  className?: string;
}

export function ColorPickerPopover({ id, value, onChange, className }: ColorPickerPopoverProps) {
  
  const handleColorChange = (color: ColorResult) => {
    const { r, g, b, a } = color.rgb;
    const rgbaString = `rgba(${r}, ${g}, ${b}, ${a})`;
    onChange(rgbaString);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn('w-36 justify-start text-left font-normal', className)}
        >
          <div className="flex w-full items-center gap-2">
            <div
              className="h-4 w-4 rounded !bg-center !bg-cover transition-all"
              style={{ background: value }}
            />
            <div className="flex-1 truncate text-xs">{value}</div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-0" align="end">
        <SketchPicker color={value} onChangeComplete={handleColorChange} />
      </PopoverContent>
    </Popover>
  );
}
