'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { MdKeyboardArrowRight } from 'react-icons/md';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Skeleton } from '@/components/ui/skeleton';

type Category = {
  id: string;
  name: string;
};

const CategoriesSection = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);

        // Replace 'categories' with your actual table name if different
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .order('name');

        if (error) throw error;

        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="flex flex-col space-y-0.5 text-black/60">
      <h3 className="text-primary font-bold text-xl hover:no-underline p-0 py-0.5">
        Categories
      </h3>

      {isLoading ? (
        // Loading skeleton
        Array(5)
          .fill(0)
          .map((_, idx) => <Skeleton key={idx} className="h-8 w-full my-1" />)
      ) : categories.length === 0 ? (
        <p className="text-gray-500 py-2">No categories available</p>
      ) : (
        categories.map(category => (
          <Link
            key={category.id}
            href={`/shop?category=${category.name}`}
            className="flex items-center justify-between py-2">
            {category.name} <MdKeyboardArrowRight />
          </Link>
        ))
      )}
    </div>
  );
};

export default CategoriesSection;
