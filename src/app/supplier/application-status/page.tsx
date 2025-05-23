'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { redirect } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Pencil,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
import { toast } from 'sonner';

type ApplicationStatus = 'pending' | 'approved' | 'rejected';

type Supplier = {
  id: string;
  business_name: string;
  status: ApplicationStatus;
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
  notes?: string;
  document_urls?: Array<{
    url: string;
    name: string;
    type: string;
  }>;
};

export default function ApplicationStatusPage() {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchSupplierData();
  }, []);

  const fetchSupplierData = async () => {
    try {
      setLoading(true);

      // Check if user is logged in
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        // Redirect to login
        window.location.href = '/login?redirect=/supplier/application-status';
        return;
      }

      // Get supplier data
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching supplier data:', error);
        // If no supplier record found, redirect to registration
        if (error.code === 'PGRST116') {
          redirect('/supplier/register');
        }
        return;
      }

      setSupplier(data as Supplier);
    } catch (error) {
      console.error('Error fetching supplier data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditDocuments = () => {
    router.push('/profile?tab=permits');
  };

  const handleDeleteDocument = async () => {
    try {
      if (!documentToDelete || !supplier) return;

      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) return;

      // Remove from storage
      const urlParts = documentToDelete.url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `documents/user-permits/${session.user.id}/${fileName}`;

      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Update document_urls in profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('document_urls')
        .eq('id', session.user.id)
        .single();

      const updatedDocs =
        profile?.document_urls?.filter(
          doc => doc.url !== documentToDelete.url
        ) || [];

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          document_urls: updatedDocs,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // Update local state
      setSupplier({
        ...supplier,
        document_urls: updatedDocs
      });

      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">No Application Found</h1>
        <p className="mb-6">You haven't applied to be a supplier yet.</p>
        <Button asChild>
          <Link href="/supplier/register">Apply Now</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Application Status</CardTitle>
              <CardDescription>{supplier.business_name}</CardDescription>
            </div>
            <Badge
              className={
                supplier.status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : supplier.status === 'rejected'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }>
              {supplier.status === 'pending' && (
                <>
                  <Clock className="h-3 w-3 mr-1" />
                  Pending Review
                </>
              )}
              {supplier.status === 'approved' && (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Approved
                </>
              )}
              {supplier.status === 'rejected' && (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Not Approved
                </>
              )}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Application Date</p>
              <p className="font-medium">
                {format(new Date(supplier.created_at), 'MMMM d, yyyy')}
              </p>
            </div>

            {supplier.approved_at && (
              <div>
                <p className="text-sm text-muted-foreground">Approved On</p>
                <p className="font-medium">
                  {format(new Date(supplier.approved_at), 'MMMM d, yyyy')}
                </p>
              </div>
            )}

            {supplier.rejected_at && (
              <div>
                <p className="text-sm text-muted-foreground">Reviewed On</p>
                <p className="font-medium">
                  {format(new Date(supplier.rejected_at), 'MMMM d, yyyy')}
                </p>
              </div>
            )}
          </div>

          {supplier.status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h3 className="font-medium flex items-center text-yellow-800">
                <Clock className="h-4 w-4 mr-2" />
                Application Under Review
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Your application is currently being reviewed by our team. This
                process typically takes 2-3 business days.
              </p>
            </div>
          )}

          {supplier.status === 'approved' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h3 className="font-medium flex items-center text-green-800">
                <CheckCircle className="h-4 w-4 mr-2" />
                Congratulations! Your application has been approved.
              </h3>
              <p className="text-sm text-green-700 mt-1">
                You can now access your supplier dashboard and start posting
                offers.
              </p>
            </div>
          )}

          {supplier.status === 'rejected' && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h3 className="font-medium flex items-center text-red-800">
                <XCircle className="h-4 w-4 mr-2" />
                Application Not Approved
              </h3>
              <p className="text-sm text-red-700 mt-1">
                We apologize, but your application was not approved at this
                time. Please review the feedback below and consider reapplying.
              </p>
            </div>
          )}

          {supplier.notes && (
            <div>
              <h3 className="font-medium mb-2">Admin Notes</h3>
              <div className="bg-gray-50 border rounded-md p-4 text-sm">
                {supplier.notes}
              </div>
            </div>
          )}

          {supplier.document_urls && supplier.document_urls.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Submitted Documents</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditDocuments}
                  className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  Manage Documents
                </Button>
              </div>
              <ul className="space-y-2">
                {supplier.document_urls.map((doc, index) => (
                  <li key={index}>
                    <div className="flex items-center justify-between p-2 bg-gray-50 border rounded-md">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center flex-1 hover:bg-gray-100">
                        <FileText className="h-4 w-4 mr-2 text-blue-500" />
                        <div>
                          <span className="text-sm font-medium">
                            {doc.name}
                          </span>
                          <p className="text-xs text-gray-500">{doc.type}</p>
                        </div>
                      </a>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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
                  </li>
                ))}
              </ul>

              <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Document</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{documentToDelete?.name}
                      "? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={handleDeleteDocument}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>

        <CardFooter>
          {supplier.status === 'rejected' && (
            <Button asChild>
              <Link href="/supplier/register">Apply Again</Link>
            </Button>
          )}

          {supplier.status === 'approved' && (
            <Button asChild>
              <Link href="/supplier/dashboard">Go to Supplier Dashboard</Link>
            </Button>
          )}

          {supplier.status === 'pending' && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Awaiting approval
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
