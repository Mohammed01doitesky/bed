'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';

interface UploadResult {
  success: boolean;
  message: string;
  studentsAdded?: number;
  errors?: string[];
}

export default function UploadStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = parseInt(params.id as string);
  
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Please select an Excel file (.xlsx, .xls) or CSV file');
      return;
    }
    
    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    setFile(selectedFile);
    setUploadResult(null);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/admin/events/${eventId}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setUploadResult(result);
        toast.success(`Successfully uploaded ${result.studentsAdded} students!`);
      } else {
        setUploadResult(result);
        toast.error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setUploadResult(null);
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.push(`/admin/events/${eventId}`)}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Students</h1>
          <p className="text-gray-600">Import student data from Excel or CSV file</p>
        </div>
      </div>

      {/* File Upload Area */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">File Upload</h2>
        </div>
        
        <div className="p-6">
          {!file ? (
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <DocumentArrowUpIcon className="mx-auto h-16 w-16 text-gray-400" />
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Drop your Excel file here
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  or click to browse and select a file
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Supports .xlsx, .xls, and .csv files (max 10MB)
                </p>
              </div>
              
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <DocumentArrowUpIcon className="h-8 w-8 text-blue-500" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{file.name}</h3>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={clearFile}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Remove
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                        Upload File
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <div className={`bg-white shadow rounded-lg border-l-4 ${
          uploadResult.success ? 'border-green-400' : 'border-red-400'
        }`}>
          <div className="p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {uploadResult.success ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                ) : (
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                )}
              </div>
              
              <div className="ml-3 w-0 flex-1">
                <h3 className={`text-sm font-medium ${
                  uploadResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {uploadResult.success ? 'Upload Successful!' : 'Upload Failed'}
                </h3>
                
                <div className={`mt-2 text-sm ${
                  uploadResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  <p>{uploadResult.message}</p>
                  
                  {uploadResult.studentsAdded && (
                    <p className="mt-1">
                      Successfully added {uploadResult.studentsAdded} students to the event.
                    </p>
                  )}
                  
                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium">Errors encountered:</p>
                      <ul className="mt-1 list-disc list-inside space-y-1">
                        {uploadResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {uploadResult.success && (
                  <div className="mt-4">
                    <button
                      onClick={() => router.push(`/admin/events/${eventId}`)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      View Event Details
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Format Instructions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">File Format Requirements</h2>
        </div>
        
        <div className="p-6">
          <div className="prose prose-sm">
            <p>Your Excel or CSV file should contain the following columns:</p>
            
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900">Required Columns:</h4>
                  <ul className="mt-2 space-y-1 text-gray-600">
                    <li>• <strong>student_id</strong> - Unique student identifier</li>
                    <li>• <strong>student_name</strong> - Full name of the student</li>
                    <li>• <strong>student_email</strong> - Student's email address</li>
                    <li>• <strong>student_email_parent_1</strong> - First parent's email</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Optional Columns:</h4>
                  <ul className="mt-2 space-y-1 text-gray-600">
                    <li>• <strong>student_email_parent_2</strong> - Second parent's email</li>
                    <li>• <strong>number_of_seats</strong> - Number of seats (default: 1)</li>
                    <li>• <strong>invitees</strong> - Comma-separated list of invitees</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900">Example Data:</h4>
              <div className="mt-2 text-xs font-mono bg-white p-3 rounded border overflow-x-auto">
                <div>student_id,student_name,student_email,student_email_parent_1,student_email_parent_2,number_of_seats,invitees</div>
                <div>2023001,Ahmed Ali,ahmed.ali@school.com,parent1@email.com,parent2@email.com,2,"Parent 1, Parent 2"</div>
                <div>2023002,Sara Mohamed,sara.mohamed@school.com,sara.parent@email.com,,1,"Mother, Father"</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}