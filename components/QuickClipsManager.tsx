'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/template_ui/TemplateToasts/use-toast';
import {
  Upload,
  File,
  Video,
  Music,
  ImageIcon,
  X,
  Play,
  Download,
  Edit2,
  Trash2,
  Check,
  Plus,
  Loader,
  GripVertical
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import AudioPlayer from '@/components/AudioPlayer';
import { UserPlanInfo } from '@/utils/userplan';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from '@hello-pangea/dnd';

interface QuickClip {
  id: number;
  name: string;
  order: number | null;
  player_id: number | null;
  r2_key: string;
  size_bytes: number;
  user_id: string | null;
  duration_seconds: number | null;
  created_at: string | null;
}

interface SelectedFile {
  file: File;
  id: number;
  isValid: boolean;
  error?: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  duration?: number; // Duration in seconds
}

interface QuickClipsManagerProps {
  playerId: number;
  userId: string;
  planInfo?: UserPlanInfo;
}

export default function QuickClipsManager({
  playerId,
  userId,
  planInfo
}: QuickClipsManagerProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [selectedClips, setSelectedClips] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query to fetch QuickClips for this player
  const { data: quickClips = [], isLoading } = useQuery({
    queryKey: ['quickClips', playerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quick_clips')
        .select('*')
        .eq('player_id', playerId)
        .order('order', { ascending: true });

      if (error) throw error;
      return data as QuickClip[];
    }
  });

  // Mutation for creating QuickClips
  const createQuickClipMutation = useMutation({
    mutationFn: async (newClip: Omit<QuickClip, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('quick_clips')
        .insert({
          ...newClip,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quickClips', playerId] });
    }
  });

  // Mutation for updating QuickClips
  const updateQuickClipMutation = useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: number;
      updates: Partial<QuickClip>;
    }) => {
      const { data, error } = await supabase
        .from('quick_clips')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quickClips', playerId] });
    }
  });

  // Mutation for deleting QuickClips
  const deleteQuickClipMutation = useMutation({
    mutationFn: async (id: number) => {
      // First get the clip to get its r2_key for deletion
      const { data: clip, error: fetchError } = await supabase
        .from('quick_clips')
        .select('r2_key')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      if (clip.r2_key) {
        try {
          await fetch('/api/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: clip.r2_key, userUUID: userId })
          });
        } catch (error) {
          console.error('Error deleting file from storage:', error);
          // Continue with database deletion even if storage deletion fails
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('quick_clips')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quickClips', playerId] });
      toast({
        title: 'Success',
        description: 'QuickClip deleted successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete QuickClip',
        variant: 'destructive'
      });
      console.error('Delete error:', error);
    }
  });

  const getFileIcon = (type: string) => {
    if (type.startsWith('audio/')) return <Music className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    );
  };

  const sanitizeFileName = (fileName: string) => {
    const sanitizedFileName = fileName.replace(/%[0-9A-Fa-f]{2}/g, '_');
    return sanitizedFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  };

  const generateR2Key = (fileName: string) => {
    const sanitizedFileName = sanitizeFileName(fileName);
    const uuid = uuidv4();
    return `${userId}/quickclip/${uuid}_${sanitizedFileName}`;
  };

  const getSignedUrl = async (fileName: string, fileType: string) => {
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: fileName, type: fileType })
    });

    if (!response.ok) {
      throw new Error('Failed to get signed URL');
    }

    const { signedUrl, publicUrl } = await response.json();
    return { signedUrl, publicUrl };
  };

  const uploadFile = async (signedUrl: string, file: File) => {
    const response = await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }
  };

  // Enhanced validation function for QuickClip files
  const validateQuickClipFile = async (
    file: File
  ): Promise<{ valid: boolean; error?: string }> => {
    // Check file type (audio files only)
    if (!file.type.startsWith('audio/')) {
      return {
        valid: false,
        error: 'Only audio files are allowed for QuickClips.'
      };
    }

    // Check file extension
    const allowedExtensions = ['.mp3', '.flac', '.wav'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !allowedExtensions.includes(`.${fileExtension}`)) {
      return {
        valid: false,
        error: 'Only MP3, FLAC, and WAV files are allowed for QuickClips.'
      };
    }

    // Check file size based on plan
    const maxSize = planInfo?.limits.quickClipSizeLimit || 5 * 1024 * 1024; // Default to 5MB
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return {
        valid: false,
        error: `File size exceeds ${maxSizeMB}MB limit.`
      };
    }

    // Check duration (30 second limit for all plans)
    try {
      const duration = await getAudioDuration(file);
      if (duration > 30) {
        return {
          valid: false,
          error: `Duration is ${Math.round(duration)}s. QuickClips must be 30 seconds or less.`
        };
      }
    } catch (error) {
      return {
        valid: false,
        error:
          'Unable to read audio file metadata. Please check the file format.'
      };
    }

    return { valid: true };
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      // Check if user has reached their clip limit
      const currentClipCount = quickClips?.length || 0;
      const maxClips = planInfo?.limits.quickClipLimit || 20;

      if (currentClipCount >= maxClips) {
        toast({
          title: 'Upload Limit Reached',
          description: `You've reached your limit of ${maxClips} clips on your plan.`,
          variant: 'destructive'
        });
        return;
      }

      const files = Array.from(e.dataTransfer.files);
      const audioFiles = files.filter((file) => file.type.startsWith('audio/'));

      if (audioFiles.length !== files.length) {
        toast({
          title: 'Warning',
          description: 'Only audio files are supported for QuickClips',
          variant: 'destructive'
        });
      }

      if (audioFiles.length === 0) return;

      // Check if adding these files would exceed the limit
      if (currentClipCount + audioFiles.length > maxClips) {
        toast({
          title: 'Upload Limit Exceeded',
          description: `You can only add ${maxClips - currentClipCount} more clips on your plan.`,
          variant: 'destructive'
        });
        return;
      }

      // Process and validate each file
      const processedFiles: SelectedFile[] = [];

      for (const file of audioFiles) {
        const fileId = Math.random().toString(36).substr(2, 9);

        try {
          const validation = await validateQuickClipFile(file);
          let duration: number | undefined;

          // Get duration for valid audio files
          if (validation.valid) {
            try {
              duration = await getAudioDuration(file);
            } catch (error) {
              console.error('Error getting duration for', file.name, error);
            }
          }

          const selectedFile: SelectedFile = {
            file,
            id: parseInt(fileId),
            isValid: validation.valid,
            error: validation.error,
            status: 'pending',
            duration
          };

          processedFiles.push(selectedFile);

          // Show individual error toast for invalid files
          if (!validation.valid) {
            toast({
              title: 'Invalid File',
              description: `${file.name}: ${validation.error}`,
              variant: 'destructive'
            });
          }
        } catch (error) {
          const selectedFile: SelectedFile = {
            file,
            id: parseInt(fileId),
            isValid: false,
            error: 'Unexpected validation error',
            status: 'pending',
            duration: undefined
          };
          processedFiles.push(selectedFile);

          toast({
            title: 'Validation Error',
            description: `${file.name}: Unable to validate file`,
            variant: 'destructive'
          });
        }
      }

      if (processedFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...processedFiles]);
      }
    },
    [toast, planInfo, quickClips]
  );

  // Function to get audio duration
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);

      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(objectUrl);
        resolve(audio.duration);
      });

      audio.addEventListener('error', () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load audio metadata'));
      });

      audio.src = objectUrl;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const currentClipCount = quickClips?.length || 0;
      const maxClips = planInfo?.limits.quickClipLimit || 20; // Default to free tier limit

      // Check if adding these files would exceed the clip limit
      if (currentClipCount + files.length > maxClips) {
        toast({
          title: 'Upload Limit Exceeded',
          description: `You can only have ${maxClips} clips on your plan. You currently have ${currentClipCount} clips.`,
          variant: 'destructive'
        });
        return;
      }

      // Process and validate each file
      const processedFiles: SelectedFile[] = [];

      for (const file of files) {
        const fileId = Math.random().toString(36).substr(2, 9);

        try {
          const validation = await validateQuickClipFile(file);
          let duration: number | undefined;

          // Get duration for valid audio files
          if (validation.valid) {
            try {
              duration = await getAudioDuration(file);
            } catch (error) {
              console.error('Error getting duration for', file.name, error);
            }
          }

          const selectedFile: SelectedFile = {
            file,
            id: parseInt(fileId),
            isValid: validation.valid,
            error: validation.error,
            status: 'pending',
            duration
          };

          processedFiles.push(selectedFile);

          // Show individual error toast for invalid files
          if (!validation.valid) {
            toast({
              title: 'Invalid File',
              description: `${file.name}: ${validation.error}`,
              variant: 'destructive'
            });
          }
        } catch (error) {
          // Handle unexpected validation errors
          const selectedFile: SelectedFile = {
            file,
            id: parseInt(fileId),
            isValid: false,
            error: 'Unexpected validation error',
            status: 'pending',
            duration: undefined
          };
          processedFiles.push(selectedFile);

          toast({
            title: 'Validation Error',
            description: `${file.name}: Unable to validate file`,
            variant: 'destructive'
          });
        }
      }

      if (processedFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...processedFiles]);
      }
    }
  };

  const removeSelectedFile = (id: number) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    // Only process valid files
    const validFiles = selectedFiles.filter((file) => file.isValid);
    if (validFiles.length === 0) {
      toast({
        title: 'No Valid Files',
        description: 'Please fix the invalid files before uploading.',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setCurrentUploadIndex(0);

    let successCount = 0;
    let failureCount = 0;

    try {
      for (let index = 0; index < validFiles.length; index++) {
        const selectedFile = validFiles[index];
        setCurrentUploadIndex(index + 1);

        // Update status to uploading
        setSelectedFiles((prev) =>
          prev.map((file) =>
            file.id === selectedFile.id
              ? { ...file, status: 'uploading' as const }
              : file
          )
        );

        try {
          const r2Key = generateR2Key(selectedFile.file.name);

          // Get signed URL for upload
          const { signedUrl } = await getSignedUrl(
            r2Key,
            selectedFile.file.type
          );

          // Upload file to R2
          await uploadFile(signedUrl, selectedFile.file);

          // Calculate next order value
          const maxOrder =
            quickClips.length > 0
              ? Math.max(...quickClips.map((clip) => clip.order || 0))
              : 0;

          // Create QuickClip record
          const newClip: Omit<QuickClip, 'id' | 'created_at'> = {
            name: selectedFile.file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
            order: maxOrder + index + 1,
            player_id: playerId,
            r2_key: r2Key,
            size_bytes: selectedFile.file.size,
            user_id: userId,
            duration_seconds: null // Will be populated by backend processing
          };

          await createQuickClipMutation.mutateAsync(newClip);

          // Update status to completed
          setSelectedFiles((prev) =>
            prev.map((file) =>
              file.id === selectedFile.id
                ? { ...file, status: 'completed' as const }
                : file
            )
          );

          successCount++;
        } catch (error) {
          console.error(`Error processing ${selectedFile.file.name}:`, error);

          // Update status to failed
          setSelectedFiles((prev) =>
            prev.map((file) =>
              file.id === selectedFile.id
                ? { ...file, status: 'failed' as const }
                : file
            )
          );

          toast({
            title: 'Upload Error',
            description: `Failed to upload ${selectedFile.file.name}. ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: 'destructive'
          });

          failureCount++;
        }

        // Update progress
        setUploadProgress(((index + 1) / validFiles.length) * 100);
      }

      // Show final results
      if (successCount > 0) {
        toast({
          title: 'Upload Complete',
          description: `Successfully uploaded ${successCount} file${successCount !== 1 ? 's' : ''}${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
          variant: failureCount > 0 ? 'destructive' : 'default'
        });
      }

      // Remove completed files, keep failed and invalid ones
      setSelectedFiles((prev) =>
        prev.filter((file) => file.status !== 'completed')
      );
      setUploadProgress(0);
      setCurrentUploadIndex(0);
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload files',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const startEdit = (clip: QuickClip) => {
    setEditingId(clip.id);
    setEditName(clip.name);
  };

  const saveEdit = async () => {
    if (!editingId) return;

    try {
      await updateQuickClipMutation.mutateAsync({
        id: editingId,
        updates: { name: editName }
      });

      setEditingId(null);
      setEditName('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to rename QuickClip',
        variant: 'destructive'
      });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const toggleClipSelection = (clipId: number) => {
    setSelectedClips((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(clipId)) {
        newSelection.delete(clipId);
      } else {
        newSelection.add(clipId);
      }
      return newSelection;
    });
  };

  const selectAllClips = () => {
    if (selectedClips.size === quickClips.length) {
      setSelectedClips(new Set());
    } else {
      setSelectedClips(new Set(quickClips.map((clip) => clip.id)));
    }
  };

  const deleteSelectedClips = async () => {
    if (selectedClips.size === 0) return;

    try {
      const deletePromises = Array.from(selectedClips).map((clipId) =>
        deleteQuickClipMutation.mutateAsync(clipId)
      );
      await Promise.all(deletePromises);

      toast({
        title: 'Success',
        description: `${selectedClips.size} clip${selectedClips.size !== 1 ? 's' : ''} deleted successfully`
      });

      setSelectedClips(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete some clips',
        variant: 'destructive'
      });
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(quickClips);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update the order property for all affected clips
    const updatePromises = items.map((clip, index) =>
      updateQuickClipMutation.mutateAsync({
        id: clip.id,
        updates: { order: index + 1 }
      })
    );

    Promise.all(updatePromises)
      // No toast needed for order updates
      .catch((error) => {
        console.error('Error updating clip order:', error);
        toast({
          title: 'Error',
          description: 'Failed to update clip order',
          variant: 'destructive'
        });
      });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    );
  };

  const getFileDuration = (bytes: number) => {
    if (bytes === 0) return 'Unknown';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    );
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-6">
          <Loader className="w-6 h-6 animate-spin" />
          <span className="ml-2">Loading QuickClips...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5" />
          QuickClips Manager
          {quickClips.length > 0 && (
            <Badge variant="secondary">
              {quickClips.length} clips in this player
            </Badge>
          )}
          {planInfo && (
            <Badge
              variant={
                quickClips.length >= planInfo.limits.quickClipLimit
                  ? 'destructive'
                  : 'outline'
              }
              className="ml-2"
            >
              {quickClips.length}/{planInfo.limits.quickClipLimit} plan clips
              used
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="leading-loose text-sm">
          QuickClips are short audio clips ideal for showcasing bulk content
          like instrument presets.
        </CardDescription>
        <CardDescription className="leading-loose text-sm">
          Clips are uploaded directly to this player — not your song library —
          and can't be reused elsewhere. Each clip is capped at 30 seconds and
          counts toward your QuickClip plan limit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Plus className="w-4 h-4" />
            <h4 className="font-medium">
              {quickClips.length > 0
                ? 'Add More Clips'
                : 'Upload Your First Clips'}
            </h4>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors space-y-2 ${
              planInfo && quickClips.length >= planInfo.limits.quickClipLimit
                ? 'border-muted-foreground/25 bg-muted/20 opacity-50'
                : dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragEnter={
              planInfo && quickClips.length >= planInfo.limits.quickClipLimit
                ? undefined
                : handleDrag
            }
            onDragLeave={
              planInfo && quickClips.length >= planInfo.limits.quickClipLimit
                ? undefined
                : handleDrag
            }
            onDragOver={
              planInfo && quickClips.length >= planInfo.limits.quickClipLimit
                ? undefined
                : handleDrag
            }
            onDrop={
              planInfo && quickClips.length >= planInfo.limits.quickClipLimit
                ? undefined
                : handleDrop
            }
          >
            <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-medium mb-1">Drop audio files here</h3>
            <div className="text-xs text-muted-foreground mb-4">
              <p>
                <span className="font-medium">Formats:</span> MP3, FLAC or WAV
              </p>
              <p>
                <span className="font-medium">Limit:</span> 30 seconds and{' '}
                {planInfo?.limits.quickClipSizeLimit
                  ? planInfo.limits.quickClipSizeLimit / (1024 * 1024)
                  : '5'}
                MB per clip
              </p>

              {planInfo &&
                quickClips.length >= planInfo.limits.quickClipLimit && (
                  <p className="text-destructive font-medium">
                    • You've reached your clip limit (
                    {planInfo.limits.quickClipLimit})
                  </p>
                )}
            </div>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={
                planInfo && quickClips.length >= planInfo.limits.quickClipLimit
              }
            >
              Browse Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept=" audio/mpeg, audio/flac, audio/wav"
              disabled={
                planInfo && quickClips.length >= planInfo.limits.quickClipLimit
              }
            />
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3 border border-muted-foreground/25 rounded-lg p-4">
              <h4 className="font-medium">
                Ready to Upload ({selectedFiles.length})
                {selectedFiles.some((file) => !file.isValid) && (
                  <Badge variant="destructive" className="ml-2">
                    {selectedFiles.filter((file) => !file.isValid).length}{' '}
                    invalid
                  </Badge>
                )}
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {selectedFiles.map((selectedFile, index) => (
                  <div
                    key={selectedFile.id}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      !selectedFile.isValid
                        ? 'bg-red-50 border border-red-200'
                        : selectedFile.status === 'uploading'
                          ? 'bg-primary/10 border border-primary'
                          : selectedFile.status === 'completed'
                            ? 'bg-green-50 border border-green-200'
                            : selectedFile.status === 'failed'
                              ? 'bg-red-50 border border-red-200'
                              : 'bg-muted/50'
                    }`}
                  >
                    {isUploading && index + 1 === currentUploadIndex ? (
                      <Loader className="w-4 h-4 animate-spin text-primary" />
                    ) : isUploading && index + 1 < currentUploadIndex ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      getFileIcon(selectedFile.file.type)
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {selectedFile.file.name}
                        {isUploading && index + 1 === currentUploadIndex && (
                          <span className="text-primary ml-2">
                            (uploading...)
                          </span>
                        )}
                        {isUploading && index + 1 < currentUploadIndex && (
                          <span className="text-green-600 ml-2">✓</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(selectedFile.file.size)}
                        {selectedFile.duration && (
                          <span className="ml-2">
                            • {formatDuration(selectedFile.duration)}
                          </span>
                        )}
                      </p>

                      {!selectedFile.isValid && selectedFile.error && (
                        <p className="text-xs text-red-600 mt-1">
                          {selectedFile.error}
                        </p>
                      )}
                    </div>
                    {!isUploading && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSelectedFile(selectedFile.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {isUploading ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span className="text-sm">
                      Uploading clip {currentUploadIndex}/{selectedFiles.length}
                      ...
                    </span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              ) : (
                <Button
                  onClick={uploadFiles}
                  className="w-full"
                  disabled={
                    createQuickClipMutation.isPending ||
                    selectedFiles.some((file) => !file.isValid)
                  }
                >
                  {selectedFiles.some((file) => !file.isValid) ? (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Fix Invalid Files First
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload {selectedFiles.length} file
                      {selectedFiles.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Uploaded Clips Management */}
        {quickClips.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">This Player's QuickClips</h4>
              {quickClips.length > 2 && (
                <div className="flex items-center gap-2">
                  {!isSelectionMode ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsSelectionMode(true)}
                    >
                      Select Mode
                    </Button>
                  ) : (
                    <>
                      {selectedClips.size > 0 && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              Delete ({selectedClips.size})
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete QuickClips
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete{' '}
                                {selectedClips.size} clip
                                {selectedClips.size !== 1 ? 's' : ''}? This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={deleteSelectedClips}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={selectAllClips}
                      >
                        {selectedClips.size === quickClips.length
                          ? 'Deselect All'
                          : 'Select All'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsSelectionMode(false);
                          setSelectedClips(new Set());
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="quickclips">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2 max-h-[600px] overflow-y-auto bg-muted/50 rounded-lg p-4"
                  >
                    {quickClips.map((clip, index) => (
                      <Draggable
                        key={clip.id}
                        draggableId={clip.id.toString()}
                        index={index}
                        isDragDisabled={
                          isSelectionMode || editingId === clip.id
                        }
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-3 p-2 border rounded-lg transition-colors ${
                              selectedClips.has(clip.id)
                                ? 'bg-primary/10 border-primary'
                                : snapshot.isDragging
                                  ? 'bg-primary/5 shadow-lg'
                                  : 'bg-white dark:bg-muted-foreground/25'
                            }`}
                          >
                            {!isSelectionMode && editingId !== clip.id && (
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                                title="Drag to reorder"
                              >
                                <GripVertical className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            {isSelectionMode && (
                              <Checkbox
                                checked={selectedClips.has(clip.id)}
                                onCheckedChange={() =>
                                  toggleClipSelection(clip.id)
                                }
                              />
                            )}
                            <Music className="w-4 h-4 text-primary" />

                            <div className="flex-1 min-w-0">
                              {editingId === clip.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={editName}
                                    onChange={(e) =>
                                      setEditName(e.target.value)
                                    }
                                    className="h-8"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveEdit();
                                      if (e.key === 'Escape') cancelEdit();
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={saveEdit}
                                    disabled={updateQuickClipMutation.isPending}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={cancelEdit}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Escape') cancelEdit();
                                    }}
                                    tabIndex={0}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm font-medium truncate">
                                    {clip.name}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>
                                      {formatFileSize(clip.size_bytes)}
                                    </span>
                                    {clip.duration_seconds && (
                                      <>
                                        <span>•</span>
                                        <span>
                                          {formatDuration(
                                            clip.duration_seconds
                                          )}
                                        </span>
                                      </>
                                    )}
                                    {clip.created_at && (
                                      <>
                                        <span>•</span>
                                        <span>
                                          {new Date(
                                            clip.created_at
                                          ).toLocaleDateString()}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>

                            {editingId !== clip.id && !isSelectionMode && (
                              <div className="flex items-center gap-1">
                                {/* <AudioPlayer
                        src={`https://r2.mixflip.io/${clip.r2_key}`}
                        progressBar={false}
                      /> */}

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEdit(clip)}
                                  title="Rename"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      title="Delete"
                                      disabled={
                                        deleteQuickClipMutation.isPending
                                      }
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete QuickClip
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "
                                        {clip.name}"? This action cannot be
                                        undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          deleteQuickClipMutation.mutate(
                                            clip.id
                                          )
                                        }
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}

        {/* Empty State */}
        {quickClips.length === 0 && selectedFiles.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No clips uploaded yet</p>
            <p className="text-xs">
              Upload your first audio files to get started
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
