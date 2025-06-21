
'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Paintbrush } from 'lucide-react';
import { SketchPicker, type ColorResult } from 'react-color';

interface ColorPickerPopoverProps {
  id?: string;
  value: string; // The full color string, e.g., 'hsl(...)' or 'rgba(...)'
  onChange: (hslString: string) => void; // Callback with the HSL component string 'h s% l%'
  className?: string;
}

export function ColorPickerPopover({ id, value, onChange, className }: ColorPickerPopoverProps) {
  
  const handleColorChange = (color: ColorResult) => {
    // Convert the color to its HSL components.
    // s and l from react-color are in the range [0, 1], so we multiply by 100 for CSS percentages.
    const { h, s, l } = color.hsl;
    const hslString = `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    onChange(hslString);
  };

  const getDisplayValue = () => {
    if (value.startsWith('hsl(')) {
        return value;
    }
     // For cases where value is just the HSL components string, wrap it.
    if (!isNaN(parseFloat(value))) {
        return `hsl(${value})`;
    }
    return value;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn('w-32 justify-start text-left font-normal', className)}
        >
          <div className="flex w-full items-center gap-2">
            <div
              className="h-4 w-4 rounded !bg-center !bg-cover transition-all"
              style={{ background: getDisplayValue() }}
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
