/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    domains: [
      'kcoertpudvkgovylgsbn.supabase.co',
      'images.unsplash.com',
      'plus.unsplash.com',
      'btmcdhltlvydssuebwir.supabase.co'
    ]
  }
};

export default nextConfig;
