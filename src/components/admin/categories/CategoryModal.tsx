'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Edit, Trash2, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Category } from '@/types/inventory.types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: Omit<Category, 'id'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<Category>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  categories: Category[];
  selectedCategory: Category | null;
  isLoading: boolean;
}

export default function CategoryModal({
  isOpen,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
  categories,
  selectedCategory,
  isLoading
}: CategoryModalProps) {
  const [activeTab, setActiveTab] = useState('list');
  const [formData, setFormData] = useState<{
    id?: string;
    name: string;
    description: string;
  }>({
    name: '',
    description: ''
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (selectedCategory) {
      setFormData({
        id: selectedCategory.id,
        name: selectedCategory.name,
        description: selectedCategory.description || ''
      });
      setActiveTab('add');
    } else {
      setFormData({
        name: '',
        description: ''
      });
    }
  }, [selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await onUpdate(formData.id, {
          name: formData.name,
          description: formData.description
        });
      } else {
        await onAdd({
          name: formData.name,
          description: formData.description
        });
      }
      setFormData({ name: '', description: '' });
      setActiveTab('list');
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleEditClick = (category: Category) => {
    setFormData({
      id: category.id,
      name: category.name,
      description: category.description || ''
    });
    setActiveTab('add');
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmation(id);
  };

  const confirmDelete = async (id: string) => {
    try {
      await onDelete(id);
      setDeleteConfirmation(null);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Category Management</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Category List</TabsTrigger>
            <TabsTrigger value="add">
              {formData.id ? 'Edit Category' : 'Add Category'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-4">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-4 text-muted-foreground">
                        No categories found. Add your first category.
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map(category => (
                      <TableRow key={category.id}>
                        <TableCell>{category.name}</TableCell>
                        <TableCell>{category.description || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(category)}
                              className="h-8 px-2">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(category.id)}
                              className="h-8 px-2 text-red-500 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setActiveTab('add')} className="gap-2">
                <Plus className="h-4 w-4" /> Add New Category
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="add" className="mt-4">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={e =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="flex justify-between mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData({ name: '', description: '' });
                      setActiveTab('list');
                    }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Category'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation */}
        {deleteConfirmation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to delete this category? This action
                cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmation(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => confirmDelete(deleteConfirmation)}
                  disabled={isLoading}>
                  {isLoading ? 'Deleting...' : 'Delete Category'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
