'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { IoMdCheckmark } from 'react-icons/io';
import { cn } from '@/lib/utils';
import ColorSelection from '../ColorSelection';
import { Color } from '@/lib/features/products/productsSlice';

interface CustomizationOptionsProps {
  onCustomizationChange: (customization: ProductCustomization) => void;
}

const ADDON_CATEGORIES = [
  'Material',
  'Legs',
  'Cushions',
  'Handles',
  'Shelves',
  'Glass Panels',
  'Drawers',
  'Upholstery',
  'Other'
] as const;

const COLORS = [
  {
    id: '1',
    name: 'Light Oak',
    value: '#D1B095',
    code: 'bg-[#D1B095]'
  },
  {
    id: '2',
    name: 'Warm Walnut',
    value: '#B58F69',
    code: 'bg-[#B58F69]'
  },
  {
    id: '3',
    name: 'Chestnut Brown',
    value: '#BA8A5B',
    code: 'bg-[#BA8A5B]'
  },
  {
    id: '4',
    name: 'Antique Leather',
    value: '#9C7C53',
    code: 'bg-[#9C7C53]'
  },
  {
    id: '5',
    name: 'Mahogany',
    value: '#8C6A44',
    code: 'bg-[#8C6A44]'
  }
] as const;

export interface ProductCustomization {
  material?: string;
  color?: Color;
  dimensions: {
    size: number;
  };
  addons: Array<{
    id: string;
    name: string;
    category: string;
    unit: string;
    quantity: number;
    price: number;
  }>;
  totalCustomizationCost?: number;
}

const materials = [
  { id: 'leather', name: 'Premium Leather', priceMultiplier: 1.5 },
  { id: 'fabric', name: 'Premium Fabric', priceMultiplier: 1.2 },
  { id: 'velvet', name: 'Velvet', priceMultiplier: 1.3 },
  { id: 'wood', name: 'Solid Wood', priceMultiplier: 1.4 },
  { id: 'custom', name: 'Custom Material', priceMultiplier: 1.0 }
];

export function CustomizationOptions({
  onCustomizationChange
}: CustomizationOptionsProps) {
  const [customization, setCustomization] = useState<ProductCustomization>({
    dimensions: { size: 80 },
    addons: []
  });

  const [customMaterial, setCustomMaterial] = useState('');
  const [newAddon, setNewAddon] = useState({
    name: '',
    category: '',
    unit: 'piece',
    quantity: 1,
    price: 0
  });
  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);
  const [materialInput, setMaterialInput] = useState('');

  const handleCustomizationChange = (
    field: keyof ProductCustomization,
    value: any
  ) => {
    const newCustomization = {
      ...customization,
      [field]: value
    };
    setCustomization(newCustomization);
    onCustomizationChange(newCustomization);
  };

  const handleAddAddon = () => {
    if (customization.addons.length >= 5) {
      alert('Maximum 5 add-ons allowed');
      return;
    }
    const addon = {
      id: Date.now().toString(),
      ...newAddon
    };
    handleCustomizationChange('addons', [...customization.addons, addon]);
    setNewAddon({
      name: '',
      category: '',
      unit: 'piece',
      quantity: 1,
      price: 0
    });
  };

  const handleEditAddon = (id: string) => {
    const addon = customization.addons.find(a => a.id === id);
    if (addon) {
      setNewAddon({
        name: addon.name,
        category: addon.category,
        unit: addon.unit,
        quantity: addon.quantity,
        price: addon.price
      });
      setEditingAddonId(id);
    }
  };

  const handleUpdateAddon = () => {
    if (editingAddonId) {
      const updatedAddons = customization.addons.map(addon =>
        addon.id === editingAddonId
          ? {
              ...addon,
              name: newAddon.name,
              category: newAddon.category,
              unit: newAddon.unit,
              quantity: newAddon.quantity,
              price: newAddon.price
            }
          : addon
      );
      handleCustomizationChange('addons', updatedAddons);
      setNewAddon({
        name: '',
        category: '',
        unit: 'piece',
        quantity: 1,
        price: 0
      });
      setEditingAddonId(null);
    }
  };

  const handleDeleteAddon = (id: string) => {
    const updatedAddons = customization.addons.filter(addon => addon.id !== id);
    handleCustomizationChange('addons', updatedAddons);
  };

  const handleColorChange = (color: Color | null) => {
    const newCustomization = {
      ...customization,
      color: color || undefined
    };
    setCustomization(newCustomization);
    onCustomizationChange(newCustomization);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Customization Options</h3>

        <div className="space-y-6">
          {/* Material Selection */}
          <div className="space-y-4">
            <Label>Material</Label>
            <div className="relative">
              <Select
                value={customization.material}
                onValueChange={value => {
                  handleCustomizationChange('material', value);
                  setMaterialInput('');
                }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select or type material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map(material => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Material</SelectItem>
                </SelectContent>
              </Select>
              {customization.material === 'custom' && (
                <div className="mt-2">
                  <Input
                    placeholder="Enter custom material"
                    value={materialInput}
                    onChange={e => {
                      const value = e.target.value;
                      setMaterialInput(value);
                      handleCustomizationChange('material', value);
                    }}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-4">
            <Label>Color</Label>
            <ColorSelection
              onColorSelect={handleColorChange}
              selectedColor={customization.color || null}
            />
            <p className="text-xs text-gray-500">
              * Color will be overlaid on the product's base color
            </p>
          </div>

          {/* Size Adjustment */}
          <div className="space-y-4">
            <Label>Dimensions (cm)</Label>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Size</Label>
                <span className="text-sm text-gray-500">
                  {customization.dimensions.size} cm
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <Slider
                  value={[customization.dimensions.size]}
                  min={30}
                  max={200}
                  step={1}
                  onValueChange={([value]) =>
                    handleCustomizationChange('dimensions', { size: value })
                  }
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Add-ons */}
          <div className="space-y-4 mt-10">
            <Label>Add-ons & Accessories</Label>
            <div className="space-y-4">
              <div className="flex w-full gap-2">
                <Select
                  value={newAddon.category}
                  onValueChange={value =>
                    setNewAddon({ ...newAddon, category: value })
                  }>
                  <SelectTrigger className="flex-[2]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ADDON_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  className="flex-[3]"
                  placeholder="Name"
                  value={newAddon.name}
                  onChange={e =>
                    setNewAddon({ ...newAddon, name: e.target.value })
                  }
                />
                <Select
                  value={newAddon.unit}
                  onValueChange={value =>
                    setNewAddon({ ...newAddon, unit: value })
                  }>
                  <SelectTrigger className="flex-[2]">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="piece">Piece</SelectItem>
                    <SelectItem value="set">Set</SelectItem>
                    <SelectItem value="pair">Pair</SelectItem>
                    <SelectItem value="meter">Meter</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  className="flex-1"
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={newAddon.quantity}
                  onChange={e =>
                    setNewAddon({
                      ...newAddon,
                      quantity: parseInt(e.target.value) || 1
                    })
                  }
                />
                <Input
                  className="flex-[2]"
                  type="number"
                  placeholder="Price"
                  value={newAddon.price || ''}
                  onChange={e =>
                    setNewAddon({
                      ...newAddon,
                      price: parseFloat(e.target.value) || 0
                    })
                  }
                />
                <Button
                  type="button"
                  className="flex-1"
                  onClick={editingAddonId ? handleUpdateAddon : handleAddAddon}
                  disabled={
                    !newAddon.category || !newAddon.name || newAddon.price <= 0
                  }>
                  {editingAddonId ? <Edit2 size={20} /> : <Plus size={20} />}
                </Button>
              </div>

              <div className="space-y-2">
                {customization.addons.map(addon => (
                  <div
                    key={addon.id}
                    className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {addon.category}
                      </span>
                      <span className="font-medium">{addon.name}</span>
                      <span className="text-sm text-gray-500">
                        {addon.quantity} {addon.unit}(s)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>₱{addon.price * addon.quantity}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditAddon(addon.id)}>
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteAddon(addon.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
