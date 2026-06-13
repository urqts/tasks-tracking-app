"use client";

import { useState, useTransition } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportTasks, type ExportFormat, type ExportScope } from "@/actions/export";
import type { TaskFilters } from "@/types";

function downloadBase64(base64: string, filename: string, mime: string) {
  const byteChars = atob(base64);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
  triggerDownload(new Blob([bytes], { type: mime }), filename);
}

function downloadText(text: string, filename: string, mime: string) {
  triggerDownload(new Blob([text], { type: mime }), filename);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButton({ filters }: { filters?: TaskFilters }) {
  const [isPending, startTransition] = useTransition();
  const [active, setActive] = useState<string | null>(null);

  function run(formatType: ExportFormat, scope: ExportScope) {
    setActive(`${formatType}-${scope}`);
    startTransition(async () => {
      try {
        const res = await exportTasks(formatType, scope, filters ?? {});
        if (res.base64) downloadBase64(res.base64, res.filename, res.mimeType);
        else if (res.csv !== undefined) downloadText(res.csv, res.filename, res.mimeType);
        toast.success("Export ready");
      } catch {
        toast.error("Export failed");
      } finally {
        setActive(null);
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Excel (.xlsx)</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => run("xlsx", "all")}><FileSpreadsheet className="h-4 w-4" /> All tasks</DropdownMenuItem>
        <DropdownMenuItem onClick={() => run("xlsx", "filtered")}><FileSpreadsheet className="h-4 w-4" /> Current filter</DropdownMenuItem>
        <DropdownMenuItem onClick={() => run("xlsx", "completed")}><FileSpreadsheet className="h-4 w-4" /> Completed only</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>CSV</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => run("csv", "all")}><FileText className="h-4 w-4" /> All tasks</DropdownMenuItem>
        <DropdownMenuItem onClick={() => run("csv", "filtered")}><FileText className="h-4 w-4" /> Current filter</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
