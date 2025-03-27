'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileChange }) => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    onFileChange(selectedFile);
  };

  return (
    <div className="mb-4">
      <Input
        type="file"
        accept=".pdf,.png,.jpg"
        onChange={handleFileChange}
        className="border border-gray-300 rounded-md p-2"
      />
      {file && <p className="mt-2 text-gray-600">Selected file: {file.name}</p>}
    </div>
  );
};

export default FileUpload;
