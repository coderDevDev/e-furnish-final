'use client';

import { usePathname } from 'next/navigation';

interface RouteWrapperProps {
  children: (pathname: string) => React.ReactNode;
}

export function RouteWrapper({ children }: RouteWrapperProps) {
  const pathname = usePathname();
  return children(pathname);
}
