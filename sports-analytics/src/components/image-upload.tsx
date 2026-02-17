"use client";

import { useCallback, useState } from "react";
import { X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImageAttachment } from "@/types/prediction";

const MAX_IMAGES = 4;
const MAX_SIZE_MB = 5;
const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

interface ImageUploadProps {
  images: ImageAttachment[];
  onChange: (images: ImageAttachment[]) => void;
  disabled?: boolean;
}

function fileToBase64(file: File): Promise<ImageAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const match = result.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        resolve({ data: match[2], mimeType: match[1] });
      } else {
        reject(new Error("Invalid file format"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function ImageUpload({
  images,
  onChange,
  disabled = false,
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  const addFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length || images.length >= MAX_IMAGES) return;
      setError("");

      const toAdd: ImageAttachment[] = [];
      for (let i = 0; i < Math.min(files.length, MAX_IMAGES - images.length); i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) {
          setError("Only images are allowed (PNG, JPEG, WebP, GIF)");
          continue;
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          setError(`Images must be under ${MAX_SIZE_MB}MB each`);
          continue;
        }
        try {
          const attachment = await fileToBase64(file);
          toAdd.push(attachment);
        } catch {
          setError("Failed to read image");
        }
      }
      if (toAdd.length) {
        onChange([...images, ...toAdd]);
      }
    },
    [images, onChange]
  );

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
    setError("");
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled || images.length >= MAX_IMAGES) return;
    addFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Attach screenshots (odds, stats, lineups) for more context
      </p>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-lg border-2 border-dashed transition-colors",
          dragActive && !disabled ? "border-primary bg-primary/5" : "border-input",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <label className="flex flex-col items-center justify-center py-6 px-4 cursor-pointer min-h-[100px]">
          <input
            type="file"
            accept={ACCEPT}
            multiple
            onChange={handleChange}
            disabled={disabled || images.length >= MAX_IMAGES}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground text-center">
            {images.length >= MAX_IMAGES
              ? "Maximum 4 images"
              : "Drag & drop images here or click to upload"}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            PNG, JPEG, WebP, GIF • max {MAX_SIZE_MB}MB each
          </span>
        </label>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div
              key={i}
              className="relative group rounded-lg overflow-hidden border border-border w-20 h-20"
            >
              <img
                src={`data:${img.mimeType};base64,${img.data}`}
                alt=""
                className="w-full h-full object-cover"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-background/90 hover:bg-destructive transition-colors"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
