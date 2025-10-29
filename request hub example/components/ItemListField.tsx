import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Plus, Trash2 } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  quantity: string;
  unitCost: string;
}

interface ItemListFieldProps {
  value: Item[];
  onChange: (items: Item[]) => void;
  required?: boolean;
}

export function ItemListField({ value, onChange, required }: ItemListFieldProps) {
  const items = value || [];

  const addItem = () => {
    const newItem: Item = {
      id: `item-${Date.now()}`,
      name: '',
      quantity: '',
      unitCost: '',
    };
    onChange([...items, newItem]);
  };

  const removeItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof Item, fieldValue: string) => {
    onChange(
      items.map(item =>
        item.id === id ? { ...item, [field]: fieldValue } : item
      )
    );
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitCost = parseFloat(item.unitCost) || 0;
      return total + (quantity * unitCost);
    }, 0);
  };

  const calculateTotalQuantity = () => {
    return items.reduce((total, item) => {
      return total + (parseFloat(item.quantity) || 0);
    }, 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>
          Items List
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Button type="button" onClick={addItem} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-500">
          <p>No items added yet</p>
          <p className="text-sm mt-1">Click "Add Item" to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`item-name-${item.id}`} className="text-sm">
                      Item Name *
                    </Label>
                    <Input
                      id={`item-name-${item.id}`}
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      placeholder="e.g., Paint Set"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`item-quantity-${item.id}`} className="text-sm">
                      Quantity *
                    </Label>
                    <Input
                      id={`item-quantity-${item.id}`}
                      type="number"
                      min="0"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`item-cost-${item.id}`} className="text-sm">
                      Unit Cost ($) *
                    </Label>
                    <Input
                      id={`item-cost-${item.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitCost}
                      onChange={(e) => updateItem(item.id, 'unitCost', e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  className="mt-7"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
              {item.quantity && item.unitCost && (
                <div className="mt-2 text-sm text-gray-600">
                  Subtotal: ${((parseFloat(item.quantity) || 0) * (parseFloat(item.unitCost) || 0)).toFixed(2)}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span>Total Items:</span>
            <span>{items.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Quantity:</span>
            <span>{calculateTotalQuantity()}</span>
          </div>
          <div className="flex justify-between">
            <span>Estimated Total Cost:</span>
            <span className="text-lg">${calculateTotal().toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
