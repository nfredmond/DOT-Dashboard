import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

interface LogoUploadProps {
  organizationId: string;
  currentLogoUrl?: string;
  onLogoUpdated: (logoUrl: string) => void;
}

export function LogoUpload({ 
  organizationId, 
  currentLogoUrl, 
  onLogoUpdated 
}: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'].includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPEG, PNG, GIF, or SVG file.',
        variant: 'destructive'
      });
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 2MB.',
        variant: 'destructive'
      });
      return;
    }

    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setLogoFile(file);

    // Clean up the object URL when component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  };

  const handleUpload = async () => {
    if (!logoFile) return;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);

      const response = await fetch(`/api/organizations/${organizationId}/logo`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload logo');
      }

      toast({
        title: 'Logo uploaded',
        description: 'Your organization logo has been updated successfully.',
      });

      onLogoUpdated(result.data.logoUrl);
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload logo',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setPreviewUrl(null);
    setLogoFile(null);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center">
            <Label className="text-lg font-medium mb-2">Organization Logo</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your organization's logo to customize the Planning Manager interface.
            </p>
            
            {previewUrl ? (
              <div className="relative w-40 h-40 mb-4">
                <img 
                  src={previewUrl} 
                  alt="Organization logo preview" 
                  className="w-full h-full object-contain border rounded-md"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 rounded-full w-8 h-8"
                  onClick={handleRemoveLogo}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="w-40 h-40 border-2 border-dashed rounded-md flex flex-col items-center justify-center mb-4 bg-muted">
                <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No logo uploaded</p>
              </div>
            )}
            
            <div className="flex flex-col items-center gap-2">
              <Input
                id="logo-upload"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/svg+xml"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('logo-upload')?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Select Logo
              </Button>
              
              {logoFile && (
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="mt-2"
                >
                  {isUploading ? 'Uploading...' : 'Upload Logo'}
                </Button>
              )}
              
              <p className="text-xs text-muted-foreground mt-2">
                Supported formats: JPEG, PNG, GIF, SVG. Max size: 2MB.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 