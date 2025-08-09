import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, File, AlertCircle, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedFileDropzoneProps {
  projectId: string;
  onUploadComplete?: () => void;
  category?: string;
  maxFiles?: number;
  className?: string;
}

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  id: string;
}

// Supported CAD file extensions
const CAD_EXTENSIONS = ['.dwg', '.dxf', '.rvt', '.rfa', '.ifc', '.step', '.stp', '.iges', '.igs', '.3dm', '.skp'];

const getFileTypeInfo = (file: File) => {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  const isCADFile = CAD_EXTENSIONS.includes(ext);
  
  let fileTypeLabel = ext.replace('.', '').toUpperCase();
  let variant: "default" | "secondary" | "outline" = "outline";
  let icon = "📄";
  
  if (isCADFile) {
    variant = "default";
    switch (ext) {
      case '.dwg':
      case '.dxf':
        fileTypeLabel = 'AutoCAD';
        icon = '🏗️';
        break;
      case '.rvt':
      case '.rfa':
        fileTypeLabel = 'Revit';
        icon = '🏢';
        break;
      case '.ifc':
        fileTypeLabel = 'IFC';
        icon = '🏭';
        break;
      case '.step':
      case '.stp':
        fileTypeLabel = 'STEP 3D';
        icon = '📦';
        break;
      case '.iges':
      case '.igs':
        fileTypeLabel = 'IGES 3D';
        icon = '⚙️';
        break;
      case '.3dm':
        fileTypeLabel = 'Rhino 3D';
        icon = '🦏';
        break;
      case '.skp':
        fileTypeLabel = 'SketchUp';
        icon = '✏️';
        break;
    }
  } else if (file.type.startsWith('image/')) {
    fileTypeLabel = 'Image';
    icon = '🖼️';
    variant = "secondary";
  } else if (file.type.includes('pdf')) {
    fileTypeLabel = 'PDF';
    icon = '📕';
    variant = "secondary";
  }
  
  return { fileTypeLabel, variant, icon, isCADFile };
};

const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
};

export default function EnhancedFileDropzone({
  projectId,
  onUploadComplete,
  category = 'other',
  maxFiles = 10,
  className
}: EnhancedFileDropzoneProps) {
  const [filesWithProgress, setFilesWithProgress] = useState<FileWithProgress[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (fileData: { file: File; category: string }) => {
      const formData = new FormData();
      formData.append('file', fileData.file);
      formData.append('category', fileData.category);
      
      return apiRequest(`/api/projects/${projectId}/documents`, {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'documents'] });
      onUploadComplete?.();
    },
  });

  const uploadFile = async (fileWithProgress: FileWithProgress) => {
    try {
      setFilesWithProgress(prev => 
        prev.map(f => f.id === fileWithProgress.id ? { ...f, status: 'uploading', progress: 0 } : f)
      );

      // Simulate progress for demo purposes
      const progressInterval = setInterval(() => {
        setFilesWithProgress(prev => 
          prev.map(f => {
            if (f.id === fileWithProgress.id && f.progress < 90) {
              return { ...f, progress: f.progress + 10 };
            }
            return f;
          })
        );
      }, 200);

      await uploadMutation.mutateAsync({ file: fileWithProgress.file, category });
      
      clearInterval(progressInterval);
      
      setFilesWithProgress(prev => 
        prev.map(f => f.id === fileWithProgress.id ? { ...f, status: 'success', progress: 100 } : f)
      );

      toast({
        title: "Upload successful",
        description: `${fileWithProgress.file.name} has been uploaded successfully.`,
      });

    } catch (error) {
      setFilesWithProgress(prev => 
        prev.map(f => f.id === fileWithProgress.id ? { 
          ...f, 
          status: 'error', 
          progress: 0,
          error: error instanceof Error ? error.message : 'Upload failed'
        } : f)
      );

      toast({
        title: "Upload failed",
        description: `Failed to upload ${fileWithProgress.file.name}`,
        variant: "destructive",
      });
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
      id: Math.random().toString(36).substr(2, 9),
    }));

    setFilesWithProgress(prev => [...prev, ...newFiles]);

    // Upload files one by one
    newFiles.forEach(fileWithProgress => {
      uploadFile(fileWithProgress);
    });
  }, [projectId, category]);

  const removeFile = (id: string) => {
    setFilesWithProgress(prev => prev.filter(f => f.id !== id));
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    maxFiles,
    maxSize: 100 * 1024 * 1024, // 100MB
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      // CAD files (may not have specific MIME types)
      'application/octet-stream': CAD_EXTENSIONS,
      'application/x-autocad': ['.dwg', '.dxf'],
      'model/vnd.dwf': ['.dwf'],
    }
  });

  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              isDragActive && !isDragReject && "border-construction-orange bg-construction-orange/5",
              isDragReject && "border-red-500 bg-red-50",
              !isDragActive && !isDragReject && "border-gray-300 hover:border-construction-orange"
            )}
          >
            <input {...getInputProps()} />
            
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-construction-orange/10 rounded-lg flex items-center justify-center">
                <Upload className={cn(
                  "w-6 h-6",
                  isDragActive ? "text-construction-orange" : "text-gray-400"
                )} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isDragActive ? "Drop files here..." : "Upload Project Files"}
                </h3>
                <p className="text-sm text-gray-500">
                  Drag and drop files here, or click to select files
                </p>
                <p className="text-xs text-gray-400">
                  Supports AutoCAD (.dwg, .dxf), Revit (.rvt, .rfa), IFC, STEP, PDFs, images, and documents
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline" className="bg-construction-orange/10">
                  <span className="mr-1">🏗️</span>
                  AutoCAD
                </Badge>
                <Badge variant="outline" className="bg-blue-50">
                  <span className="mr-1">🏢</span>
                  Revit
                </Badge>
                <Badge variant="outline" className="bg-green-50">
                  <span className="mr-1">🏭</span>
                  IFC
                </Badge>
                <Badge variant="outline" className="bg-gray-50">
                  <span className="mr-1">📄</span>
                  Documents
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload Progress */}
      {filesWithProgress.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm text-gray-900 mb-3">
              Uploading Files ({filesWithProgress.length})
            </h4>
            <div className="space-y-3">
              {filesWithProgress.map((fileWithProgress) => {
                const { fileTypeLabel, variant, icon, isCADFile } = getFileTypeInfo(fileWithProgress.file);
                
                return (
                  <div key={fileWithProgress.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <span className="text-lg">{icon}</span>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {fileWithProgress.file.name}
                        </p>
                        <Badge variant={variant} className={isCADFile ? 'bg-construction-orange/10 text-construction-orange' : ''}>
                          {fileTypeLabel}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{formatFileSize(fileWithProgress.file.size)}</span>
                        {fileWithProgress.status === 'uploading' && (
                          <span>• Uploading...</span>
                        )}
                        {fileWithProgress.status === 'success' && (
                          <span className="text-green-600">• Upload complete</span>
                        )}
                        {fileWithProgress.status === 'error' && (
                          <span className="text-red-600">• Upload failed</span>
                        )}
                      </div>
                      
                      {fileWithProgress.status === 'uploading' && (
                        <div className="mt-2">
                          <Progress 
                            value={fileWithProgress.progress} 
                            className="h-1.5"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-shrink-0">
                      {fileWithProgress.status === 'success' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {fileWithProgress.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      {fileWithProgress.status !== 'uploading' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(fileWithProgress.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}