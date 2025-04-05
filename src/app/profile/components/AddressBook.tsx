'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Plus } from 'lucide-react';

export default function AddressBook() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Address Book</CardTitle>
        <CardDescription>Manage your delivery addresses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-10">
          <MapPin className="h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold">No Addresses Yet</h3>
          <p className="mt-1 text-center text-sm text-gray-500">
            Add addresses to make checkout faster
          </p>
          <Button className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add New Address
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
