"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, CheckSquare, FolderKanban, Tag as TagIcon, Folder } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { globalSearch, type SearchResults } from "@/actions/search";

const EMPTY: SearchResults = { tasks: [], projects: [], categories: [], tags: [] };

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [isPending, startTransition] = useTransition();
  const debounced = useDebounce(query, 250);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounced.trim().length < 1) {
      setResults(EMPTY);
      return;
    }
    startTransition(async () => {
      setResults(await globalSearch(debounced));
    });
  }, [debounced]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const total =
    results.tasks.length + results.projects.length + results.categories.length + results.tags.length;

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <div ref={containerRef} className="relative max-w-md">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search tasks, projects, tags…"
          className="pl-9"
          aria-label="Global search"
        />
        {isPending && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && query.trim().length > 0 && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border bg-popover shadow-lg">
          {total === 0 && !isPending ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No results found.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto scrollbar-thin py-1">
              {results.tasks.map((t) => (
                <button key={t.id} onClick={() => go(`/tasks?focus=${t.id}`)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-accent">
                  <CheckSquare className="h-4 w-4 text-muted-foreground" /> {t.title}
                </button>
              ))}
              {results.projects.map((p) => (
                <button key={p.id} onClick={() => go(`/projects?focus=${p.id}`)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-accent">
                  <FolderKanban className="h-4 w-4" style={{ color: p.color }} /> {p.name}
                </button>
              ))}
              {results.categories.map((c) => (
                <button key={c.id} onClick={() => go(`/tasks?categoryId=${c.id}`)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-accent">
                  <Folder className="h-4 w-4" style={{ color: c.color }} /> {c.name}
                </button>
              ))}
              {results.tags.map((tag) => (
                <button key={tag.id} onClick={() => go(`/tasks?tagId=${tag.id}`)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-accent">
                  <TagIcon className="h-4 w-4" style={{ color: tag.color }} /> {tag.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
