import React from 'react';
import Link from 'next/link';
import {
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';

type MenuItemProps = {
  label: string;
  url: string;
  onClick?: () => void;
};

export function MenuItem({ label, url, onClick }: MenuItemProps) {
  return (
    <NavigationMenuItem>
      {onClick ? (
        <button
          onClick={onClick}
          className={cn(
            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
          )}>
          {label}
        </button>
      ) : (
        <Link href={url} legacyBehavior passHref>
          <NavigationMenuLink
            className={cn(
              'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
            )}>
            {label}
          </NavigationMenuLink>
        </Link>
      )}
    </NavigationMenuItem>
  );
}
