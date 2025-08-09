import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, Image, Wrench } from 'lucide-react';

interface FileUploadZoneProps {
  compact?: boolean;
  onFilesUploaded?: (files: File[]) => void;
}

export function FileUploadZone({ compact = false, onFilesUploaded }: FileUploadZoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('Files dropped:', acceptedFiles);
    onFilesUploaded?.(acceptedFiles);
  }, [onFilesUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'],
      'application/pdf': ['.pdf'],
      'application/dwg': ['.dwg'],
      'application/dxf': ['.dxf'],
      'application/x-autocad': ['.dwg', '.dxf'],
      'model/*': ['.rvt', '.rfa', '.ifc', '.step', '.stp'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  if (compact) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="p-6">
          <div {...getRootProps()} className="cursor-pointer text-center">
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Drop files here or click to select
            </p>
            <p className="text-xs text-muted-foreground">
              CAD, Images, PDFs (100MB max)
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-dashed">
      <CardContent className="p-8">
        <div 
          {...getRootProps()} 
          className={`cursor-pointer text-center transition-colors ${
            isDragActive ? 'bg-muted' : ''
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          
          {isDragActive ? (
            <div>
              <p className="text-lg font-medium mb-2">Drop the files here...</p>
              <p className="text-muted-foreground">Release to upload</p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium mb-2">Drag & drop files here</p>
              <p className="text-muted-foreground mb-4">
                or click to select files from your computer
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 max-w-md mx-auto">
                <div className="flex flex-col items-center space-y-1">
                  <Wrench className="h-6 w-6 text-blue-500" />
                  <span className="text-xs text-muted-foreground">CAD Files</span>
                  <span className="text-xs text-muted-foreground">.dwg, .dxf, .rvt</span>
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <Image className="h-6 w-6 text-green-500" />
                  <span className="text-xs text-muted-foreground">Images</span>
                  <span className="text-xs text-muted-foreground">.jpg, .png, .gif</span>
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <FileText className="h-6 w-6 text-red-500" />
                  <span className="text-xs text-muted-foreground">Documents</span>
                  <span className="text-xs text-muted-foreground">.pdf, .doc, .txt</span>
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <FileText className="h-6 w-6 text-purple-500" />
                  <span className="text-xs text-muted-foreground">3D Models</span>
                  <span className="text-xs text-muted-foreground">.ifc, .step, .iges</span>
                </div>
              </div>
              
              <Button type="button">
                Select Files
              </Button>
            </div>
          )}
          
          <div className="mt-4 text-xs text-muted-foreground">
            Maximum file size: 100MB • Antivirus scanning enabled
          </div>
        </div>
      </CardContent>
    </Card>
  );
}