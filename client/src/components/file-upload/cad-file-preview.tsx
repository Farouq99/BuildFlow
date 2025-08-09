import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, Share } from "lucide-react";
import { format } from "date-fns";
import type { Document } from "@shared/schema";

interface CADFilePreviewProps {
  document: Document & { uploader?: any };
  onDownload?: (document: Document) => void;
  onPreview?: (document: Document) => void;
  onShare?: (document: Document) => void;
}

// CAD file type mappings
const CAD_FILE_TYPES = {
  '.dwg': { name: 'AutoCAD Drawing', color: 'bg-red-100 text-red-800', icon: '🏗️' },
  '.dxf': { name: 'AutoCAD Exchange', color: 'bg-red-100 text-red-800', icon: '📐' },
  '.rvt': { name: 'Revit Project', color: 'bg-blue-100 text-blue-800', icon: '🏢' },
  '.rfa': { name: 'Revit Family', color: 'bg-blue-100 text-blue-800', icon: '🧱' },
  '.ifc': { name: 'Industry Foundation', color: 'bg-green-100 text-green-800', icon: '🏭' },
  '.step': { name: 'STEP 3D Model', color: 'bg-purple-100 text-purple-800', icon: '📦' },
  '.stp': { name: 'STEP 3D Model', color: 'bg-purple-100 text-purple-800', icon: '📦' },
  '.iges': { name: 'IGES 3D Model', color: 'bg-orange-100 text-orange-800', icon: '⚙️' },
  '.igs': { name: 'IGES 3D Model', color: 'bg-orange-100 text-orange-800', icon: '⚙️' },
  '.3dm': { name: 'Rhino 3D Model', color: 'bg-yellow-100 text-yellow-800', icon: '🦏' },
  '.skp': { name: 'SketchUp Model', color: 'bg-indigo-100 text-indigo-800', icon: '✏️' },
};

const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
};

export default function CADFilePreview({ 
  document, 
  onDownload, 
  onPreview, 
  onShare 
}: CADFilePreviewProps) {
  const fileExt = document.fileExtension?.toLowerCase() || '';
  const cadInfo = CAD_FILE_TYPES[fileExt as keyof typeof CAD_FILE_TYPES];
  const isCADFile = document.isCADFile;

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${isCADFile ? 'border-construction-orange/30' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
              {isCADFile && cadInfo ? (
                <span className="text-2xl">{cadInfo.icon}</span>
              ) : (
                <FileText className="w-6 h-6 text-gray-600" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg line-clamp-1" title={document.name}>
                {document.name}
              </CardTitle>
              <CardDescription>
                {document.originalName !== document.name && (
                  <span className="text-sm text-muted-foreground">
                    Original: {document.originalName}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          
          {isCADFile && (
            <Badge variant="outline" className="bg-construction-orange/10 text-construction-orange border-construction-orange/30">
              CAD File
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* File Type and Size Information */}
        <div className="flex flex-wrap gap-2">
          {cadInfo && (
            <Badge variant="secondary" className={cadInfo.color}>
              {cadInfo.name}
            </Badge>
          )}
          <Badge variant="outline">
            {document.fileType}
          </Badge>
          {document.fileSize && (
            <Badge variant="outline">
              {formatFileSize(document.fileSize)}
            </Badge>
          )}
        </div>

        {/* CAD File Specific Information */}
        {isCADFile && document.cadFileType && (
          <div className="bg-construction-orange/5 p-3 rounded-lg">
            <h4 className="font-semibold text-sm text-construction-gray">CAD File Details</h4>
            <div className="mt-2 space-y-1 text-sm">
              <p><span className="font-medium">Type:</span> {cadInfo?.name || document.cadFileType.toUpperCase()}</p>
              {document.description && (
                <p><span className="font-medium">Description:</span> {document.description}</p>
              )}
              {document.tags && document.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {document.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p>
            <span className="font-medium">Category:</span> 
            <span className="capitalize ml-1">{document.category?.replace('_', ' ')}</span>
          </p>
          <p>
            <span className="font-medium">Uploaded:</span> 
            <span className="ml-1">{format(new Date(document.uploadedAt!), 'MMM dd, yyyy at h:mm a')}</span>
          </p>
          {document.uploader && (
            <p>
              <span className="font-medium">By:</span>
              <span className="ml-1">{document.uploader.firstName} {document.uploader.lastName}</span>
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          {onDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(document)}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          )}
          
          {onPreview && !isCADFile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPreview(document)}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview
            </Button>
          )}
          
          {onShare && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onShare(document)}
              className="flex items-center gap-2"
            >
              <Share className="w-4 h-4" />
              Share
            </Button>
          )}
          
          {isCADFile && (
            <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
              <span className="text-xs">Requires CAD software to open</span>
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}