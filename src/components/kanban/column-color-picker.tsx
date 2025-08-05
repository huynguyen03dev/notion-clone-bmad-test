'use client';

import { useState } from 'react';
import { useColumnApi } from '@/hooks/use-column-api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Palette } from 'lucide-react';

interface Column {
  id: string;
  name: string;
  color?: string | null;
}

interface ColumnColorPickerProps {
  column: Column;
  isOpen: boolean;
  onClose: () => void;
  onColorUpdated: () => void;
}

const PRESET_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Lime', value: '#84CC16' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Gray', value: '#6B7280' },
];

export function ColumnColorPicker({
  column,
  isOpen,
  onClose,
  onColorUpdated,
}: ColumnColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState(column.color || '');
  const [customColor, setCustomColor] = useState('');
  const { updateColumn, isLoading } = useColumnApi();

  const handleClose = () => {
    setSelectedColor(column.color || '');
    setCustomColor('');
    onClose();
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setCustomColor('');
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    if (color.match(/^#[0-9A-F]{6}$/i)) {
      setSelectedColor(color);
    }
  };

  const handleRemoveColor = () => {
    setSelectedColor('');
    setCustomColor('');
  };

  const handleSave = async () => {
    const result = await updateColumn(column.id, {
      color: selectedColor || null,
    });

    if (result) {
      onColorUpdated();
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Change Column Color
          </DialogTitle>
          <DialogDescription>
            Choose a color for the &quot;{column.name}&quot; column to help organize your board.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preset Colors */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Preset Colors</Label>
            <div className="grid grid-cols-6 gap-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`w-12 h-12 rounded-lg border-2 transition-all hover:scale-105 ${
                    selectedColor === color.value
                      ? 'border-gray-900 ring-2 ring-gray-300'
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => handleColorSelect(color.value)}
                  title={color.name}
                  aria-label={`Select ${color.name} color`}
                />
              ))}
            </div>
          </div>

          {/* Custom Color */}
          <div className="space-y-3">
            <Label htmlFor="custom-color" className="text-sm font-medium">
              Custom Color
            </Label>
            <div className="flex gap-3 items-center">
              <Input
                id="custom-color"
                type="text"
                placeholder="#3B82F6"
                value={customColor}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                className="font-mono"
                maxLength={7}
              />
              <div
                className="w-12 h-10 rounded border-2 border-gray-300 flex-shrink-0"
                style={{
                  backgroundColor: customColor.match(/^#[0-9A-F]{6}$/i) ? customColor : '#f3f4f6',
                }}
              />
            </div>
            <p className="text-xs text-gray-500">
              Enter a hex color code (e.g., #3B82F6)
            </p>
          </div>

          {/* Remove Color Option */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Remove Color</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveColor}
              className="w-full"
            >
              Remove Color (Use Default)
            </Button>
          </div>

          {/* Preview */}
          {selectedColor && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Preview</Label>
              <div
                className="p-3 border rounded-lg"
                style={{
                  borderLeftColor: selectedColor,
                  borderLeftWidth: '4px',
                  borderLeftStyle: 'solid',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{column.name}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    Preview
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Color
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
