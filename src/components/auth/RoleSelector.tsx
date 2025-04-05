'use client';

import { motion } from 'framer-motion';
import { User, Store, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface RoleSelectorProps {
  onSelect: (role: 'user' | 'supplier' | 'admin') => void;
  selectedRole?: 'user' | 'supplier' | 'admin';
}

const roles = [
  {
    id: 'user',
    title: 'Customer',
    description: 'Shop and manage your orders',
    icon: User
  },
  {
    id: 'supplier',
    title: 'Supplier',
    description: 'Manage your products and orders',
    icon: Store
  },
  {
    id: 'admin',
    title: 'Owner',
    description: 'Full system management',
    icon: ShieldCheck
  }
];

export function RoleSelector({ onSelect, selectedRole }: RoleSelectorProps) {
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {roles.map(role => (
        <motion.div
          key={role.id}
          className={`
            relative cursor-pointer rounded-xl p-4 
            ${
              selectedRole === role.id
                ? 'bg-primary text-white'
                : 'bg-white hover:bg-primary/5'
            }
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(role.id as 'user' | 'supplier' | 'admin')}
          onHoverStart={() => setHoveredRole(role.id)}
          onHoverEnd={() => setHoveredRole(null)}>
          <div className="flex flex-col items-center text-center space-y-3">
            <role.icon
              size={32}
              className={
                selectedRole === role.id ? 'text-white' : 'text-primary'
              }
            />
            <h3 className="font-semibold">{role.title}</h3>
            <p className="text-sm opacity-80">{role.description}</p>
          </div>
          {hoveredRole === role.id && (
            <motion.div
              className="absolute inset-0 border-2 border-primary rounded-xl"
              layoutId="outline"
              initial={false}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 25
              }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}
