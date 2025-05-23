'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import {
  FileText,
  Loader2,
  X,
  MoreVertical,
  Pencil,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

// Add permit type enum
export enum PermitType {
  MAYORS_PERMIT = "Mayor's Permit",
  DTI = 'DTI Registration',
  SANITARY = 'Sanitary Permit to Operate',
  BIR = 'BIR Permit',
  TAX_CLEARANCE = 'Tax Clearance',
  OTHER = 'Other Document'
}

// Update document state type
interface DocumentInfo {
  url: string;
  type: PermitType;
  name: string;
}

interface PermitsTabProps {
  supplierStatus: string | null;
}

export default function PermitsTab({ supplierStatus }: PermitsTabProps) {
  const [documents, setDocuments] = useState<File[]>([]);
  const [selectedType, setSelectedType] = useState<PermitType>(
    PermitType.MAYORS_PERMIT
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [existingDocs, setExistingDocs] = useState<DocumentInfo[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentInfo | null>(
    null
  );
  const [editingDocument, setEditingDocument] = useState<DocumentInfo | null>(
    null
  );
  const [isCheckingApplication, setIsCheckingApplication] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadExistingDocuments();
  }, []);

  const loadExistingDocuments = async () => {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('document_urls')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      if (profile?.document_urls) {
        setExistingDocs(profile.document_urls);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load existing documents');
    } finally {
      setIsCheckingApplication(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setDocuments([...documents, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const uploadDocument = async (
    file: File,
    userId: string,
    type: PermitType
  ): Promise<DocumentInfo> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `user-permits/${userId}/${type}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;
      if (!data?.path) throw new Error('Upload failed - no path returned');

      const {
        data: { publicUrl }
      } = supabase.storage.from('documents').getPublicUrl(fileName);

      return {
        url: publicUrl,
        type,
        name: file.name
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  };

  const handleUpload = async () => {
    try {
      setIsUploading(true);
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to upload documents');
        return;
      }

      const documentInfos = [];
      for (let i = 0; i < documents.length; i++) {
        setUploadProgress(Math.round((i / documents.length) * 50));
        const docInfo = await uploadDocument(
          documents[i],
          session.user.id,
          selectedType
        );
        documentInfos.push(docInfo);
      }

      // Update profile with new document URLs
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          document_urls: [...existingDocs, ...documentInfos],
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      toast.success('Documents uploaded successfully');
      setDocuments([]);
      loadExistingDocuments();
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error('Failed to upload documents');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (doc: DocumentInfo) => {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) return;

      // Remove from storage
      const urlParts = doc.url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `user-permits/${session.user.id}/${doc.type}/${fileName}`;

      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Remove from document_urls array
      const updatedDocs = existingDocs.filter(d => d.url !== doc.url);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          document_urls: updatedDocs,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      setExistingDocs(updatedDocs);
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    } finally {
      setDocumentToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleUpdate = async (doc: DocumentInfo, newType: PermitType) => {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) return;

      // Update document type
      const updatedDocs = existingDocs.map(d =>
        d.url === doc.url ? { ...d, type: newType } : d
      );

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          document_urls: updatedDocs,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      setExistingDocs(updatedDocs);
      toast.success('Document updated successfully');
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('Failed to update document');
    } finally {
      setEditingDocument(null);
    }
  };

  if (isCheckingApplication) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Show read-only view if application is pending or approved
  if (supplierStatus === 'pending' || supplierStatus === 'approved') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Permits & Certifications</CardTitle>
          <CardDescription>
            {supplierStatus === 'pending'
              ? 'Your application is under review. Documents cannot be modified at this time.'
              : 'Your documents have been approved. Contact support for any changes.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {existingDocs.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">Submitted Documents</h3>
              <div className="grid gap-2">
                {existingDocs.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center flex-1">
                      <FileText className="h-4 w-4 text-blue-500 mr-2" />
                      <div>
                        <span className="text-sm font-medium">{doc.name}</span>
                        <p className="text-xs text-gray-500">{doc.type}</p>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show full edit functionality for rejected or no application
  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Permits & Certifications</CardTitle>
        <CardDescription>
          Upload and manage your business documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Documents */}
        {existingDocs.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Existing Documents</h3>
            <div className="grid gap-2">
              {existingDocs.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center flex-1">
                    <FileText className="h-4 w-4 text-blue-500 mr-2" />
                    <div>
                      <span className="text-sm font-medium">{doc.name}</span>
                      <p className="text-xs text-gray-500">{doc.type}</p>
                    </div>
                  </a>

                  {/* Document actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingDocument(doc)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Change Type
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          setDocumentToDelete(doc);
                          setDeleteDialogOpen(true);
                        }}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload section with permit type selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Upload New Documents
          </label>
          <div className="grid gap-4">
            <Select
              value={selectedType}
              onValueChange={value => setSelectedType(value as PermitType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(PermitType).map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => document.getElementById('file-upload')?.click()}>
              Select Files
            </Button>
            <input
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
          </div>
        </div>

        {/* Selected Files List */}
        {documents.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Selected Files</h3>
            <ul className="space-y-2">
              {documents.map((file, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between px-3 py-2 border rounded-md">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-sm truncate max-w-xs">
                      {file.name}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}>
                    <X className="h-4 w-4 text-gray-500" />
                  </Button>
                </li>
              ))}
            </ul>

            <Button
              className="w-full mt-4"
              onClick={handleUpload}
              disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading ({uploadProgress}%)
                </>
              ) : (
                'Upload Documents'
              )}
            </Button>
          </div>
        )}

        {/* Edit Dialog */}
        {editingDocument && (
          <Dialog
            open={!!editingDocument}
            onOpenChange={() => setEditingDocument(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Document Type</DialogTitle>
                <DialogDescription>
                  Select a new type for "{editingDocument.name}"
                </DialogDescription>
              </DialogHeader>
              <Select
                value={editingDocument.type}
                onValueChange={value => {
                  handleUpdate(editingDocument, value as PermitType);
                }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PermitType).map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{documentToDelete?.name}"? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() =>
                  documentToDelete && handleDelete(documentToDelete)
                }>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
