'use client'

import { useState, useRef } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Upload, X, FileText, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CloudinaryUploadProps {
  value?: string
  onChange: (url: string) => void
  accept?: string
  maxSizeMB?: number
  folder?: string
  label?: string
  placeholder?: string
}

export function CloudinaryUpload({
  value,
  onChange,
  accept = 'application/pdf',
  maxSizeMB = 10,
  folder = 'sermons',
  label = 'Upload file',
  placeholder = 'No file selected'
}: CloudinaryUploadProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: `Maximum file size is ${maxSizeMB}MB`,
        variant: 'destructive',
      })
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', 'unsigned_preset') // You'll need to configure this in Cloudinary
      formData.append('folder', folder)

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      onChange(data.secure_url)
      toast({ title: 'File uploaded successfully' })
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Please check your Cloudinary credentials',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    onChange('')
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-sm truncate hover:underline"
          >
            {value.split('/').pop()}
          </a>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={uploading}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {label}
          </Button>
        </div>
      )}
    </div>
  )
}
