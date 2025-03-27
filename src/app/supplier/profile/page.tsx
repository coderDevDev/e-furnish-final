'use client';

import ProfileVerification from './ProfileVerification';
import SupplierDetails from './SupplierDetails';

export default function ProfilePage() {
  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold">Supplier Profile</h1>

      <div className="grid grid-cols-1 gap-8">
        <SupplierDetails />
        <ProfileVerification />
      </div>
    </div>
  );
}
