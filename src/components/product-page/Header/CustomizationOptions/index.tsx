'use client';

import { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { HexColorPicker } from 'react-colorful';
import { Plus, Trash2, Edit2, DollarSign } from 'lucide-react';
import { IoMdCheckmark } from 'react-icons/io';
import { cn } from '@/lib/utils';
import ColorSelection from '../ColorSelection';
import { Color } from '@/lib/features/products/productsSlice';

// Define Color type
export interface Color {
  name: string;
  color: string;
}

// Define ProductCustomization type
export interface ProductCustomization {
  fields: Record<string, any>;
  material?: string;
  color?: Color;
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    size?: number;
  };
  addons: Array<{
    id: string;
    name: string;
    category: string;
    unit: string;
    quantity: number;
    price: number;
  }>;
  components?: Record<string, string>;
  totalCustomizationCost?: number;
  isDownpayment?: boolean;
  downpaymentAmount?: number;
}

interface CustomizationOptionsProps {
  onCustomizationChange: (customization: ProductCustomization) => void;
  initialCustomization?: ProductCustomization | null;
  customizationOptions: any[];
}

export const CustomizationOptions = ({
  onCustomizationChange,
  initialCustomization,
  customizationOptions = []
}: CustomizationOptionsProps) => {
  const [customization, setCustomization] = useState<ProductCustomization>({
    fields: {},
    addons: []
  });

  // Initialize customization from initialCustomization prop if available
  useEffect(() => {
    if (initialCustomization) {
      setCustomization(initialCustomization);
    }
  }, [initialCustomization]);

  // Update parent component when customization changes
  useEffect(() => {
    onCustomizationChange(customization);
  }, [customization, onCustomizationChange]);

  const updateCustomization = (fieldName: string, value: any) => {
    setCustomization(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldName]: value
      }
    }));
  };

  const renderField = (field: any) => {
    if (!field.enabled) return null;

    switch (field.fieldType) {
      case 'dropdown':
        return (
          <div className="space-y-2">
            <Label>
              {field.fieldName
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())}
            </Label>
            <Select
              onValueChange={value =>
                updateCustomization(field.fieldName, value)
              }
              value={customization.fields[field.fieldName] || ''}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.fieldName}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option: any) => (
                  <SelectItem key={option.name} value={option.name}>
                    {option.name}{' '}
                    {option.price > 0 ? `(+₱${option.price})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'color':
        return (
          <div className="space-y-4">
            <Label>
              {field.fieldName
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())}
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {field.options.map((option: any) => (
                <div
                  key={option.name}
                  onClick={() =>
                    updateCustomization(field.fieldName, option.name)
                  }
                  className={`p-1 border rounded-md cursor-pointer ${
                    customization.fields[field.fieldName] === option.name
                      ? 'ring-2 ring-primary'
                      : ''
                  }`}>
                  <div
                    className="w-full h-10 rounded-sm"
                    style={{ backgroundColor: option.color }}
                  />
                  <div className="text-xs text-center mt-1">
                    {option.name}
                    {option.price > 0 && (
                      <div className="text-xs">+₱{option.price}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'dimensions':
        return (
          <div className="space-y-2">
            <Label>
              {field.fieldName
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())}
              {field.pricingImpact?.pricePerUnit > 0 &&
                ` (₱${field.pricingImpact.pricePerUnit} per unit)`}
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Width (cm)</Label>
                <Input
                  type="number"
                  min="1"
                  value={customization.fields[field.fieldName]?.width || 0}
                  onChange={e => {
                    const width = parseInt(e.target.value);
                    updateCustomization(field.fieldName, {
                      ...(customization.fields[field.fieldName] || {}),
                      width
                    });
                  }}
                />
              </div>
              <div>
                <Label className="text-xs">Height (cm)</Label>
                <Input
                  type="number"
                  min="1"
                  value={customization.fields[field.fieldName]?.height || 0}
                  onChange={e => {
                    const height = parseInt(e.target.value);
                    updateCustomization(field.fieldName, {
                      ...(customization.fields[field.fieldName] || {}),
                      height
                    });
                  }}
                />
              </div>
              <div>
                <Label className="text-xs">Depth (cm)</Label>
                <Input
                  type="number"
                  min="1"
                  value={customization.fields[field.fieldName]?.depth || 0}
                  onChange={e => {
                    const depth = parseInt(e.target.value);
                    updateCustomization(field.fieldName, {
                      ...(customization.fields[field.fieldName] || {}),
                      depth
                    });
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-2">
            <Label>
              {field.fieldName
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())}
              {field.pricingImpact?.basePrice > 0 &&
                ` (Base: ₱${field.pricingImpact.basePrice}`}
              {field.pricingImpact?.pricePerLetter > 0 &&
                `, Per letter: ₱${field.pricingImpact.pricePerLetter})`}
            </Label>
            <Input
              placeholder={`Enter ${field.fieldName}`}
              value={customization.fields[field.fieldName] || ''}
              onChange={e =>
                updateCustomization(field.fieldName, e.target.value)
              }
            />
            {field.pricingImpact?.pricePerLetter > 0 &&
              customization.fields[field.fieldName] && (
                <div className="text-xs text-gray-500">
                  {customization.fields[field.fieldName].length} characters × ₱
                  {field.pricingImpact.pricePerLetter} = ₱
                  {customization.fields[field.fieldName].length *
                    field.pricingImpact.pricePerLetter}
                </div>
              )}
          </div>
        );

      case 'multi-select':
        return (
          <div className="space-y-2">
            <Label>
              {field.fieldName
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())}
            </Label>
            <div className="space-y-2">
              {field.options.map((option: any) => (
                <div key={option.name} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.fieldName}-${option.name}`}
                    checked={(
                      customization.fields[field.fieldName] || []
                    ).includes(option.name)}
                    onCheckedChange={checked => {
                      const current =
                        customization.fields[field.fieldName] || [];
                      let updated;
                      if (checked) {
                        updated = [...current, option.name];
                      } else {
                        updated = current.filter(
                          (item: string) => item !== option.name
                        );
                      }
                      updateCustomization(field.fieldName, updated);
                    }}
                  />
                  <Label htmlFor={`${field.fieldName}-${option.name}`}>
                    {option.name}{' '}
                    {option.price > 0 ? `(+₱${option.price})` : ''}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'toggle':
        return (
          <div className="flex items-center justify-between">
            <Label>
              {field.fieldName
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())}
              {field.pricingImpact?.flatFee > 0 &&
                ` (+₱${field.pricingImpact.flatFee})`}
            </Label>
            <Switch
              checked={!!customization.fields[field.fieldName]}
              onCheckedChange={checked =>
                updateCustomization(field.fieldName, checked)
              }
            />
          </div>
        );

      case 'design':
        return (
          <div className="space-y-2">
            <Label>
              {field.fieldName
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())}
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {field.options.map((option: any) => (
                <div
                  key={option.name}
                  onClick={() =>
                    updateCustomization(field.fieldName, option.name)
                  }
                  className={`border rounded-md p-2 cursor-pointer transition-all ${
                    customization.fields[field.fieldName] === option.name
                      ? 'ring-2 ring-primary'
                      : ''
                  }`}>
                  {option.imageUrl ? (
                    <div className="h-24 flex items-center justify-center mb-2">
                      <img
                        src={option.imageUrl}
                        alt={option.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-24 flex items-center justify-center bg-gray-100 mb-2">
                      <span className="text-gray-500 text-sm">No image</span>
                    </div>
                  )}
                  <div className="text-sm font-medium">{option.name}</div>
                  {option.price > 0 && (
                    <div className="text-xs text-gray-500">
                      +₱{option.price}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <Label>
              {field.fieldName
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())}
              {field.pricingImpact?.flatFee > 0 &&
                ` (+₱${field.pricingImpact.flatFee})`}
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                type="file"
                onChange={e => {
                  // In a real implementation, you would handle file upload here
                  // For now, we'll just set a flag indicating a file was selected
                  updateCustomization(
                    field.fieldName,
                    e.target.files && e.target.files.length > 0
                  );
                }}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!customizationOptions || customizationOptions.length === 0) {
    return <div>No customization options available for this product.</div>;
  }

  // Group fields by category for better organization
  const groupedFields = customizationOptions.reduce((acc: any, field: any) => {
    if (field.fieldName === 'pricing') return acc; // Skip pricing configuration

    // Determine category based on field type
    let category = 'General';
    if (['woodType', 'woodFinish', 'woodStain'].includes(field.fieldName)) {
      category = 'Material';
    } else if (['size', 'dimensions'].includes(field.fieldName)) {
      category = 'Dimensions';
    } else if (
      ['engraving', 'engravingFont', 'carve'].includes(field.fieldName)
    ) {
      category = 'Personalization';
    } else if (['paintColor', 'accentColor'].includes(field.fieldName)) {
      category = 'Colors';
    }

    if (!acc[category]) acc[category] = [];
    acc[category].push(field);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Accordion type="single" collapsible className="w-full">
        {Object.entries(groupedFields).map(
          ([category, fields]: [string, any]) => (
            <AccordionItem key={category} value={category}>
              <AccordionTrigger>{category}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 p-2">
                  {fields.map((field: any) => (
                    <div key={field.fieldName}>{renderField(field)}</div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        )}
      </Accordion>
    </div>
  );
};
