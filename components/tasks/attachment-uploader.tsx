"use client";

import { useRef, useState, useTransition } from "react";
import { Paperclip, Upload, Trash2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { registerAttachment, deleteAttachment, getAttachmentUrl } from "@/actions/attachments";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";
import type { Attachment } from "@/types";

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "attachments";
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

interface AttachmentUploaderProps {
  taskId: string;
  userId: string;
  initial: Attachment[];
}

/**
 * Uploads files directly to Supabase Storage from the browser, then registers
 * metadata via a Server Action. Supports any file type.
 */
export function AttachmentUploader({ taskId, userId, initial }: AttachmentUploaderProps) {
  const [items, setItems] = useState<Attachment[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const supabase = createClient();
    setUploading(true);

    for (const file of Array.from(files)) {
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is larger than 25 MB`);
        continue;
      }
      const path = `${userId}/${taskId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
      if (error) {
        toast.error(`Upload failed: ${file.name}`);
        continue;
      }
      const res = await registerAttachment({
        taskId,
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        storagePath: path,
      });
      if (res.success) {
        setItems((cur) => [
          ...cur,
          { id: res.data.id, fileName: file.name, fileType: file.type, fileSize: file.size, storagePath: path } as Attachment,
        ]);
      }
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function download(id: string) {
    startTransition(async () => {
      const res = await getAttachmentUrl(id);
      if (res.success) window.open(res.data.url, "_blank");
      else toast.error(res.error);
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteAttachment(id);
      if (res.success) {
        setItems((cur) => cur.filter((a) => a.id !== id));
        toast.success("Attachment removed");
      } else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Paperclip className="h-4 w-4" /> Attachments
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
        </Button>
        <input ref={inputRef} type="file" multiple hidden onChange={(e) => onFiles(e.target.files)} />
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
          No attachments yet.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{a.fileName}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(a.fileSize)}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => download(a.id)} disabled={isPending} aria-label="Download">
                  <Download className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(a.id)} disabled={isPending} aria-label="Delete">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
