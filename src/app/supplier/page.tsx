'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { redirect } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import Link from 'next/link';
import { Package, Truck, FileSignature } from 'lucide-react';

export default function SupplierHomePage() {
  const [supplierStatus, setSupplierStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkSupplierStatus();
  }, []);

  const checkSupplierStatus = async () => {
    try {
      setLoading(true);

      // Check if user is logged in
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        // If not logged in, redirect to login page
        window.location.href = '/login?redirect=/supplier';
        return;
      }

      // Check if supplier exists
      const { data, error } = await supabase
        .from('suppliers')
        .select('status')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking supplier status:', error);
      }

      setSupplierStatus(data?.status || null);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not a supplier yet, show registration info
  if (!supplierStatus) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
          Become a Supplier
        </h1>
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl sm:text-2xl">
              Join Our Supplier Network
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Partner with us to provide quality materials and supplies to
              woodworking craftsmen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm sm:text-base">
                As a supplier, you can post offers, receive orders, and grow
                your business with our community of craftsmen.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-3 sm:pt-4">
                <div className="flex flex-col items-center text-center p-3 sm:p-4 border rounded-lg">
                  <FileSignature className="h-8 w-8 sm:h-10 sm:w-10 text-primary mb-2" />
                  <h3 className="font-medium text-sm sm:text-base">
                    Easy Application
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Simple registration process to get started
                  </p>
                </div>
                <div className="flex flex-col items-center text-center p-3 sm:p-4 border rounded-lg">
                  <Package className="h-8 w-8 sm:h-10 sm:w-10 text-primary mb-2" />
                  <h3 className="font-medium text-sm sm:text-base">
                    Post Offers
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    List your materials and set your own prices
                  </p>
                </div>
                <div className="flex flex-col items-center text-center p-3 sm:p-4 border rounded-lg">
                  <Truck className="h-8 w-8 sm:h-10 sm:w-10 text-primary mb-2" />
                  <h3 className="font-medium text-sm sm:text-base">
                    Manage Orders
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Efficiently process orders from craftsmen
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/supplier/register">Register as Supplier</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If has pending application
  if (supplierStatus === 'pending') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
          Supplier Application
        </h1>
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl sm:text-2xl">
              Application In Review
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Your supplier application is currently being reviewed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm sm:text-base">
              Thank you for applying to be a supplier. Our team is currently
              reviewing your application and documents. You will be notified
              once a decision has been made.
            </p>
            <p className="text-sm sm:text-base">
              You can check the status of your application at any time.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/supplier/application-status">
                View Application Status
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If approved, redirect to dashboard
  console.log({ supplierStatus });
  if (supplierStatus === 'approved') {
    redirect('/supplier/dashboard');
  }

  // If rejected
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
        Supplier Application
      </h1>
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl sm:text-2xl">
            Application Was Not Approved
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Unfortunately, your application was not approved at this time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm sm:text-base">
            We're sorry, but your supplier application was not approved. You can
            check the details on your application status page to see any
            feedback provided.
          </p>
          <p className="text-sm sm:text-base">
            You're welcome to reapply with updated information or additional
            documentation.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 sm:space-x-3">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/supplier/application-status">
              View Application Status
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/supplier/register">Apply Again</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
