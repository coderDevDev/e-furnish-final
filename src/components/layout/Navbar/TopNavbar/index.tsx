import { cn } from '@/lib/utils';
import { integralCF } from '@/styles/fonts';
import Link from 'next/link';
import React, { useState, useRef, useEffect } from 'react';
import { NavMenu } from '../navbar.types';
import { MenuList } from './MenuList';
import {
  NavigationMenu,
  NavigationMenuList
} from '@/components/ui/navigation-menu';
import { MenuItem } from './MenuItem';
import Image from 'next/image';
import InputGroup from '@/components/ui/input-group';
import ResTopNavbar from './ResTopNavbar';
import CartBtn from './CartBtn';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  LogOut,
  User,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  Move
} from 'lucide-react';
import { toast } from 'sonner';
import OrdersBtn from './OrdersBtn';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

// Add interface for document info
interface DocumentInfo {
  url: string;
  type: string;
  name: string;
}

const TopNavbar = () => {
  const supabase = createClientComponentClient();
  const [showPermits, setShowPermits] = useState(false);
  const [currentPermitIndex, setCurrentPermitIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const imageContainerRef = useRef(null);
  const [businessPermits, setBusinessPermits] = useState<DocumentInfo[]>([]);
  const [currentType, setCurrentType] = useState<string>('');
  const [currentTypePermits, setCurrentTypePermits] = useState<DocumentInfo[]>(
    []
  );

  const navMenuItems: NavMenu = [
    {
      id: 1,
      type: 'MenuItem',
      label: 'Shop',
      url: '/shop#furniture',
      children: []
    },
    {
      id: 2,
      type: 'MenuItem',
      label: 'About Us',
      url: '#',
      onClick: () => setShowPermits(true),
      children: []
    }
  ];

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast.success('Logged out successfully');
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  useEffect(() => {
    setZoomLevel(1);
    setIsZoomed(false);
    loadBusinessPermits();
  }, []);

  useEffect(() => {
    if (businessPermits.length > 0) {
      // Get unique types
      const types = [...new Set(businessPermits.map(doc => doc.type))];
      setCurrentType(types[0]);
    }
  }, [businessPermits]);

  useEffect(() => {
    // Filter permits by current type
    const permitsOfType = businessPermits.filter(
      doc => doc.type === currentType
    );
    setCurrentTypePermits(permitsOfType);
    setCurrentPermitIndex(0); // Reset index when type changes
  }, [currentType, businessPermits]);

  const loadBusinessPermits = async () => {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('document_urls')
        .eq('id', '55a5b517-e3f2-4460-8d17-9083923d3b43')
        .single();

      if (error) throw error;
      if (profile?.document_urls) {
        setBusinessPermits(profile.document_urls);
      }
    } catch (error) {
      console.error('Error loading permits:', error);
    }
  };

  const nextPermit = () => {
    setCurrentPermitIndex(prev =>
      prev === currentTypePermits.length - 1 ? 0 : prev + 1
    );
  };

  const prevPermit = () => {
    setCurrentPermitIndex(prev =>
      prev === 0 ? currentTypePermits.length - 1 : prev - 1
    );
  };

  const currentPermit = currentTypePermits[currentPermitIndex];

  const handleZoomIn = e => {
    e.stopPropagation();
    if (zoomLevel < 3) {
      setZoomLevel(prevZoom => prevZoom + 0.5);
      setIsZoomed(true);
    }
  };

  const handleZoomOut = e => {
    e.stopPropagation();
    if (zoomLevel > 1) {
      setZoomLevel(prevZoom => prevZoom - 0.5);
      if (zoomLevel <= 1.5) {
        setIsZoomed(false);
      }
    }
  };

  const toggleZoom = () => {
    if (isZoomed) {
      setZoomLevel(1);
      setIsZoomed(false);
    } else {
      setZoomLevel(2);
      setIsZoomed(true);
    }
  };

  return (
    <nav className="sticky top-0 bg-white z-20 border-b border-secondary border-b-2">
      <div className="flex relative max-w-frame mx-auto items-center justify-end md:justify-between py-5 md:py-6 px-4 xl:px-0">
        <div className="flex items-center">
          <div className="block md:hidden mr-4">
            <ResTopNavbar data={navMenuItems} />
          </div>
          <Link
            href="/"
            className={cn([
              integralCF.className,
              'text-2xl lg:text-[32px] mb-2 mr-3 lg:mr-10 text-primary'
            ])}>
            e.Furnish
          </Link>
          <NavigationMenu className="hidden md:flex mr-2 lg:mr-7">
            <NavigationMenuList>
              {navMenuItems.map(item => (
                <React.Fragment key={item.id}>
                  {item.type === 'MenuItem' && (
                    <MenuItem
                      label={item.label}
                      url={item.url}
                      onClick={item.onClick}
                    />
                  )}
                  {item.type === 'MenuList' && (
                    <MenuList data={item.children} label={item.label} />
                  )}
                </React.Fragment>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* <InputGroup className="hidden md:flex bg-[#F0F0F0] mr-3 lg:mr-10">
          <InputGroup.Text>
            <Image
              priority
              src="/icons/search.svg"
              height={20}
              width={20}
              alt="search"
              className="min-w-5 min-h-5"
            />
          </InputGroup.Text>
          <InputGroup.Input
            type="search"
            name="search"
            placeholder="Search for products..."
            className="bg-transparent placeholder:text-black/40"
          />
        </InputGroup> */}
        <div className="flex items-center">
          <Link href="/search" className="block md:hidden mr-[14px] p-1">
            <Image
              priority
              src="/icons/search-black.svg"
              height={100}
              width={100}
              alt="search"
              className="max-w-[22px] max-h-[22px]"
            />
          </Link>
          <OrdersBtn />
          <CartBtn />
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1 outline-none">
              <User className="w-[22px] h-[22px]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => setShowPermits(true)}>
                <FileText className="mr-2 h-4 w-4" />
                About Us
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 cursor-pointer"
                onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Business Permits Dialog */}
      <Dialog open={showPermits} onOpenChange={setShowPermits}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="mb-2 sm:mb-4">
            <DialogTitle className="text-lg sm:text-xl">
              Business Permits & Certifications
            </DialogTitle>
            <DialogDescription className="text-sm">
              Official business documents and certifications
            </DialogDescription>
          </DialogHeader>

          {/* Document type selector */}
          <div className="mb-4">
            <Select value={currentType} onValueChange={setCurrentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {[...new Set(businessPermits.map(doc => doc.type))].map(
                  type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            {/* Image viewer */}
            <div className="flex justify-center items-center min-h-[200px] sm:min-h-[300px] md:min-h-[400px] bg-gray-100 rounded-md overflow-hidden">
              {currentPermit ? (
                <div
                  ref={imageContainerRef}
                  className="relative w-full h-full flex justify-center items-center p-2 sm:p-4 overflow-hidden">
                  <div
                    className={`relative ${
                      isZoomed ? 'cursor-move' : 'cursor-zoom-in'
                    } transition-transform duration-200`}
                    onClick={toggleZoom}>
                    <Image
                      src={currentPermit.url}
                      alt={currentPermit.name}
                      width={600}
                      height={800}
                      className={`object-contain ${
                        isZoomed
                          ? 'max-h-none'
                          : 'w-auto h-auto max-h-[250px] sm:max-h-[350px] md:max-h-[500px]'
                      }`}
                      style={{
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'center',
                        transition: 'transform 0.3s ease'
                      }}
                      onError={e => {
                        e.currentTarget.src = '/placeholder-document.png';
                      }}
                    />
                  </div>

                  {/* Zoom controls */}
                  <div className="absolute bottom-2 right-2 flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow-md"
                      onClick={handleZoomOut}
                      disabled={zoomLevel <= 1}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow-md"
                      onClick={handleZoomIn}
                      disabled={zoomLevel >= 3}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Zoom indicator */}
                  {isZoomed && (
                    <div className="absolute top-2 left-2 bg-black/50 text-white text-xs p-1 rounded">
                      <Move className="h-4 w-4 inline mr-1" />
                      {Math.round(zoomLevel * 100)}%
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <FileText className="mx-auto h-8 w-8 sm:h-12 sm:w-12 mb-2" />
                  <p>No documents available</p>
                </div>
              )}
            </div>

            {/* Navigation controls */}
            {currentTypePermits.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full h-8 w-8 sm:h-10 sm:w-10"
                  onClick={prevPermit}>
                  <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full h-8 w-8 sm:h-10 sm:w-10"
                  onClick={nextPermit}>
                  <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
                </Button>
              </>
            )}
          </div>

          {/* Document info and pagination */}
          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div>
              <h3 className="font-medium text-base sm:text-lg">
                {currentPermit?.name}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500">
                {currentPermit?.type}
              </p>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2 self-center sm:self-auto mt-2 sm:mt-0">
              {currentTypePermits.map((_, index) => (
                <span
                  key={index}
                  className={`block h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full cursor-pointer ${
                    index === currentPermitIndex ? 'bg-primary' : 'bg-gray-300'
                  }`}
                  onClick={() => setCurrentPermitIndex(index)}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  );
};

export default TopNavbar;
