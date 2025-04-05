'use client';

import { useState, useEffect } from 'react';
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
import { Plus, Trash2, Edit2, DollarSign } from 'lucide-react';
import { IoMdCheckmark } from 'react-icons/io';
import { cn } from '@/lib/utils';
import ColorSelection from '../ColorSelection';
import { Color } from '@/lib/features/products/productsSlice';

interface CustomizationOptionsProps {
  onCustomizationChange: (customization: ProductCustomization) => void;
  initialCustomization?: ProductCustomization | null;
}

const ADDON_CATEGORIES = ['Carve'] as const;

const materials = [
  {
    id: 'narra',
    name: 'Narra Wood',
    description:
      'Premium Philippine hardwood, known for durability and rich color',
    priceMultiplier: 2.0,
    price: 3500
  },
  {
    id: 'mahogany',
    name: 'Mahogany',
    description: 'Classic reddish-brown wood with excellent durability',
    priceMultiplier: 1.5,
    price: 2500
  },
  {
    id: 'red_lauan',
    name: 'Red Lauan',
    description: 'Light to medium hardwood with reddish color',
    priceMultiplier: 1.3,
    price: 2000
  },
  {
    id: 'coco_lumber',
    name: 'Coco Lumber',
    description: 'Sustainable wood from coconut trees, medium density',
    priceMultiplier: 1.0,
    price: 1500
  }
];

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

// Add unit type definitions
type UnitType = {
  value: string;
  label: string;
  defaultQuantity: number;
  priceMultiplier: number;
};

const UNIT_TYPES: UnitType[] = [
  { value: 'single', label: '1 piece', defaultQuantity: 1, priceMultiplier: 1 },
  {
    value: 'pair',
    label: '2 pieces',
    defaultQuantity: 2,
    priceMultiplier: 1.8
  }, // 10% discount per piece
  {
    value: 'set-4',
    label: 'Set of 4',
    defaultQuantity: 4,
    priceMultiplier: 3.4
  }, // 15% discount per piece
  {
    value: 'set-6',
    label: 'Set of 6',
    defaultQuantity: 6,
    priceMultiplier: 4.8
  } // 20% discount per piece
];

export function CustomizationOptions({
  onCustomizationChange,
  initialCustomization
}: CustomizationOptionsProps) {
  const [customization, setCustomization] = useState<ProductCustomization>({
    material: initialCustomization?.material || materials[0].id,
    color: initialCustomization?.color || {
      id: '1',
      name: 'Light Oak',
      value: '#D1B095',
      code: 'bg-[#D1B095]',
      price: 1000,
      hex: '#D1B095'
    },
    dimensions: initialCustomization?.dimensions || { size: 100 },
    addons: initialCustomization?.addons || []
  });

  const [customMaterial, setCustomMaterial] = useState('');
  const [newAddon, setNewAddon] = useState({
    id: '',
    category: ADDON_CATEGORIES[0],
    name: '',
    unit: UNIT_TYPES[0].value,
    quantity: UNIT_TYPES[0].defaultQuantity,
    basePrice: 500,
    price: 0
  });
  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);
  const [materialInput, setMaterialInput] = useState('');

  useEffect(() => {
    calculateTotalCost();
  }, [customization]);

  const calculateTotalCost = () => {
    let total = 0;

    // Material cost
    const selectedMaterial = materials.find(
      m => m.id === customization.material
    );
    if (selectedMaterial) {
      total += selectedMaterial.price;
    }

    // Color cost
    if (customization.color?.price) {
      total += customization.color.price;
    }

    // Addons cost - calculate based on quantity and unit type
    const addonsCost = customization.addons.reduce((sum, addon) => {
      const unitType = UNIT_TYPES.find(u => u.value === addon.unit);
      if (!unitType) return sum + addon.price * addon.quantity;

      // Calculate price based on unit type multiplier
      const basePrice = addon.price / unitType.priceMultiplier;
      const totalAddonPrice = calculateAddonPrice(basePrice, addon.unit);

      return sum + totalAddonPrice;
    }, 0);

    total += addonsCost;

    return total;
  };

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

    const unitType = UNIT_TYPES.find(u => u.value === newAddon.unit);
    if (!unitType) return;

    const addon = {
      id: Date.now().toString(),
      ...newAddon,
      price: calculateAddonPrice(newAddon.basePrice, newAddon.unit)
    };

    handleCustomizationChange('addons', [...customization.addons, addon]);
    setNewAddon({
      id: '',
      category: ADDON_CATEGORIES[0],
      name: '',
      unit: UNIT_TYPES[0].value,
      quantity: UNIT_TYPES[0].defaultQuantity,
      basePrice: 500,
      price: 0
    });
  };

  const handleEditAddon = (id: string) => {
    const addon = customization.addons.find(a => a.id === id);
    if (addon) {
      setNewAddon({
        id: addon.id,
        category: addon.category,
        name: addon.name,
        unit: addon.unit,
        quantity: addon.quantity,
        basePrice: addon.price,
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
        id: '',
        category: ADDON_CATEGORIES[0],
        name: '',
        unit: UNIT_TYPES[0].value,
        quantity: UNIT_TYPES[0].defaultQuantity,
        basePrice: 0,
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

  // Add helper function to calculate addon price based on unit type
  const calculateAddonPrice = (basePrice: number, unitType: string) => {
    const unit = UNIT_TYPES.find(u => u.value === unitType);
    if (!unit) return basePrice;
    return Math.round(basePrice * unit.priceMultiplier);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Customization Options</h3>

          <div className="space-y-6">
            {/* Material Selection */}
            <div className="space-y-4">
              <Label>Material</Label>
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
                      <div className="flex justify-between w-full">
                        <span>{material.name} - </span>
                        <span className="text-gray-500">₱{material.price}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {/* <SelectItem value="custom">Custom Material</SelectItem> */}
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

            {/* Color Selection with Prices */}
            <div className="space-y-4">
              <Label>Color</Label>
              <ColorSelection
                onColorSelect={color =>
                  handleCustomizationChange('color', color)
                }
                selectedColor={customization.color}
              />
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
                    onValueChange={value => {
                      const unit = UNIT_TYPES.find(u => u.value === value);
                      if (unit) {
                        setNewAddon({
                          ...newAddon,
                          unit: value,
                          quantity: unit.defaultQuantity,
                          price: calculateAddonPrice(newAddon.basePrice, value)
                        });
                      }
                    }}>
                    <SelectTrigger className="flex-[2]">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_TYPES.map(unit => (
                        <SelectItem key={unit.value} value={unit.value}>
                          <div className="flex justify-between w-full">
                            <span>{unit.label}</span>
                            {unit.defaultQuantity > 1 && (
                              <span className="text-gray-500 text-xs">
                                {Math.round(
                                  (1 -
                                    (1 / unit.priceMultiplier) *
                                      unit.defaultQuantity) *
                                    100
                                )}
                                % off
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    disabled
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
                    disabled
                    placeholder="Price per piece"
                    value={newAddon.basePrice || ''}
                    onChange={e => {
                      const basePrice = parseFloat(e.target.value) || 0;
                      setNewAddon({
                        ...newAddon,
                        basePrice: basePrice,
                        price: calculateAddonPrice(basePrice, newAddon.unit)
                      });
                    }}
                  />
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={
                      editingAddonId ? handleUpdateAddon : handleAddAddon
                    }
                    disabled={
                      !newAddon.category ||
                      !newAddon.name ||
                      newAddon.price <= 0
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
                          {UNIT_TYPES.find(u => u.value === addon.unit)
                            ?.label || `${addon.quantity} ${addon.unit}(s)`}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div>₱{addon.price}</div>
                          {addon.quantity > 1 && (
                            <div className="text-xs text-gray-500">
                              (₱{Math.round(addon.price / addon.quantity)} each)
                            </div>
                          )}
                        </div>
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

      {/* Cost Summary */}
      <div className="border-t pt-4">
        <h4 className="font-semibold mb-3">Customization Summary</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>
              Material (
              {materials.find(m => m.id === customization.material)?.name})
            </span>
            <span>
              ₱
              {materials.find(m => m.id === customization.material)?.price || 0}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Color ({customization.color?.name})</span>
            <span>₱{customization.color?.price || 0}</span>
          </div>
          {customization.addons.length > 0 && (
            <div className="space-y-1">
              <div className="font-medium">Add-ons:</div>
              {customization.addons.map(addon => {
                const unitType = UNIT_TYPES.find(u => u.value === addon.unit);
                const basePrice = unitType
                  ? addon.price / unitType.priceMultiplier
                  : addon.price;
                const totalPrice = calculateAddonPrice(basePrice, addon.unit);

                return (
                  <div key={addon.id} className="flex justify-between pl-4">
                    <span>
                      {addon.name} (
                      {UNIT_TYPES.find(u => u.value === addon.unit)?.label})
                    </span>
                    <div className="text-right">
                      <span>₱{totalPrice}</span>
                      {addon.quantity > 1 && (
                        <div className="text-xs text-gray-500">
                          (₱{Math.round(totalPrice / addon.quantity)} each)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Total Customization Cost</span>
            <span>₱{calculateTotalCost()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
