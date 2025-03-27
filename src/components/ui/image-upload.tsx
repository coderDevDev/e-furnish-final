'use client';

import { useCallback, useState } from 'react';
import { FileWithPath, useDropzone } from 'react-dropzone';
import { Image as ImageIcon, X, Upload } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (value: string | File | File[]) => void;
  onRemove: () => void;
  disabled?: boolean;
  preview?: string;
  multiple?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled,
  preview,
  multiple = false
}: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[]) => {
      try {
        if (multiple) {
          onChange(acceptedFiles);
        } else {
          const file = acceptedFiles[0];
          if (!file) return;
          onChange(file);
        }
      } catch (error) {
        console.error('Error handling file:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to handle file'
        );
      }
    },
    [onChange, multiple]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    disabled,
    multiple
  });

  return (
    <div className="space-y-4 w-full">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer',
          isDragActive && 'border-primary bg-gray-50',
          disabled && 'opacity-50 cursor-default',
          error && 'border-red-500'
        )}>
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2 p-4">
          <Upload className="h-10 w-10 text-gray-400" />
          <p className="text-sm text-gray-500">
            {multiple
              ? 'Drag & drop images or click to upload'
              : 'Drag & drop or click to upload'}
          </p>
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
