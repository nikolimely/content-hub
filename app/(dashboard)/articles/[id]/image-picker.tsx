"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Loader2, X, Link2, Upload, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Photo = {
  id: number;
  src: string;
  thumb: string;
  alt: string;
  photographer: string;
  pexelsUrl: string;
};

type Props = {
  articleId: string;
  onInsert: (path: string, alt: string, credit: string | null) => void;
  onClose: () => void;
  onUploadStart?: () => void;
  featured?: boolean;
};

export function ImagePicker({ articleId, onInsert, onClose, onUploadStart, featured }: Props) {
  const [tab, setTab] = useState<"pexels" | "pixabay" | "repo" | "url">("pexels");
  const [source, setSource] = useState<"pexels" | "pixabay">("pexels");
  const [repoImages, setRepoImages] = useState<{ name: string; publicPath: string; rawUrl: string; liveUrl: string; proxyPath: string; subfolder: string }[]>([]);
  const [loadingRepo, setLoadingRepo] = useState(false);
  const [repoSearch, setRepoSearch] = useState("");
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [altInput, setAltInput] = useState("");
  // For inline images: pending photo waiting for a filename word
  const [pendingPhoto, setPendingPhoto] = useState<Photo | null>(null);
  const [filenameWord, setFilenameWord] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const wordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function fetchRepoImages() {
    setLoadingRepo(true);
    const res = await fetch(`/api/articles/${articleId}/assets`);
    const data = await res.json();
    setRepoImages(data.images ?? []);
    setLoadingRepo(false);
  }
  useEffect(() => {
    if (pendingPhoto) setTimeout(() => wordInputRef.current?.focus(), 50);
  }, [pendingPhoto]);

  const search = useCallback(async (q: string, src: "pexels" | "pixabay" = source) => {
    if (!q.trim()) return;
    setSearching(true);
    setPage(1);
    const res = await fetch(`/api/${src}?q=${encodeURIComponent(q)}&page=1`);
    const data = await res.json();
    setPhotos(data.photos ?? []);
    setHasMore(!!data.nextPage);
    setSearching(false);
  }, [source]);

  async function loadMore() {
    if (!query.trim()) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const res = await fetch(`/api/${source}?q=${encodeURIComponent(query)}&page=${nextPage}`);
    const data = await res.json();
    setPhotos((prev) => [...prev, ...(data.photos ?? [])]);
    setHasMore(!!data.nextPage);
    setPage(nextPage);
    setLoadingMore(false);
  }

  async function uploadPhoto(photo: Photo, suffix?: string) {
    setUploading(photo.id);
    onUploadStart?.();
    const res = await fetch(`/api/articles/${articleId}/upload-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pexelsUrl: photo.src,
        alt: photo.alt,
        photographer: photo.photographer,
        featured,
        filenameSuffix: suffix,
      }),
    });
    const data = await res.json();
    setUploading(null);
    if (data.path) {
      onInsert(data.path, data.alt, data.credit);
      onClose();
    }
  }

  function handlePhotoClick(photo: Photo) {
    if (featured) {
      uploadPhoto(photo);
    } else {
      setPendingPhoto(photo);
      setFilenameWord("");
    }
  }

  function handleWordConfirm() {
    if (!pendingPhoto || !filenameWord.trim()) return;
    const slug = filenameWord.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    uploadPhoto(pendingPhoto, slug);
    setPendingPhoto(null);
  }

  function handleUrlInsert() {
    if (!urlInput) return;
    onInsert(urlInput, altInput, null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#161616] border border-white/[0.08] rounded-xl w-[640px] max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
          <div className="flex gap-1">
            {(["pexels", "pixabay", "repo", "url"] as const).map((t) => (
              <button key={t} onClick={() => {
                setTab(t);
                setPendingPhoto(null);
                setPhotos([]);
                if (t === "pexels" || t === "pixabay") {
                  setSource(t);
                  if (query.trim()) search(query, t);
                }
                if (t === "repo") fetchRepoImages();
              }}
                className={cn("px-3 py-1 text-xs rounded transition-colors",
                  tab === t ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                )}>
                {t === "pexels" ? "Pexels" : t === "pixabay" ? "Pixabay" : t === "repo" ? "Repo" : "Insert URL"}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Filename word prompt for inline images */}
        {pendingPhoto && (
          <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.02] shrink-0 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pendingPhoto.thumb} alt={pendingPhoto.alt} className="w-16 h-10 object-cover rounded shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/40 mb-1.5">Name this image — e.g. <span className="text-white/60">Hero Image</span> → <span className="font-mono text-white/50">article-slug-hero-image.jpg</span></p>
              <div className="flex items-center gap-2">
                <input
                  ref={wordInputRef}
                  value={filenameWord}
                  onChange={(e) => setFilenameWord(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleWordConfirm();
                    if (e.key === "Escape") setPendingPhoto(null);
                  }}
                  placeholder="e.g. Hero Image or keyword research steps"
                  className="flex-1 bg-[#1a1a1a] border border-white/[0.08] rounded px-3 py-1.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20 font-mono"
                />
                <button
                  onClick={handleWordConfirm}
                  disabled={!filenameWord.trim() || uploading !== null}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white text-black text-xs font-medium rounded hover:bg-white/90 disabled:opacity-40 transition-colors shrink-0"
                >
                  {uploading !== null ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />}
                  Upload
                </button>
                <button onClick={() => setPendingPhoto(null)} className="text-white/30 hover:text-white transition-colors shrink-0">
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "repo" ? (
          <>
            <div className="px-4 py-3 border-b border-white/[0.06] shrink-0">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                <input
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  placeholder="Filter by filename..."
                  className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-lg pl-8 pr-4 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loadingRepo ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={20} className="animate-spin text-white/30" />
                </div>
              ) : repoImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <p className="text-sm text-white/20">No images found in repo</p>
                </div>
              ) : (() => {
                const filtered = repoSearch.trim()
                  ? repoImages.filter((img) => img.name.toLowerCase().includes(repoSearch.toLowerCase()))
                  : repoImages;
                return filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2">
                    <p className="text-sm text-white/20">No images match &ldquo;{repoSearch}&rdquo;</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {filtered.map((img) => (
                      <button
                        key={img.publicPath}
                        onClick={() => { onInsert(img.publicPath, img.name.replace(/\.[^.]+$/, "").replace(/-/g, " "), null); onClose(); }}
                        className="relative group aspect-video rounded-lg overflow-hidden bg-white/[0.04] hover:ring-2 hover:ring-white/30 transition-all"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/api/articles/${articleId}/assets/proxy?path=${encodeURIComponent(img.proxyPath)}`} alt={img.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end">
                          <div className="w-full px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-[10px] text-white/80 truncate">{img.name}</p>
                            <p className="text-[9px] text-white/40 truncate">{img.subfolder}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          </>
        ) : tab === "pexels" || tab === "pixabay" ? (
          <>
            <div className="px-4 py-3 border-b border-white/[0.06] shrink-0">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && search(query)}
                  placeholder="Search Pexels... (press Enter)"
                  className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-lg pl-8 pr-4 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {searching ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={20} className="animate-spin text-white/30" />
                </div>
              ) : photos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <p className="text-sm text-white/20">Search for images above</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => handlePhotoClick(photo)}
                      disabled={uploading !== null}
                      className="relative group aspect-video rounded-lg overflow-hidden bg-white/[0.04] hover:ring-2 hover:ring-white/30 transition-all disabled:opacity-50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.thumb} alt={photo.alt} className="w-full h-full object-cover" />
                      {uploading === photo.id ? (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 size={18} className="animate-spin text-white" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end">
                          <div className="w-full px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-[10px] text-white/80 truncate">{photo.photographer}</p>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {photos.length > 0 && (
              <div className="px-4 py-2 border-t border-white/[0.06] shrink-0 flex items-center justify-between">
                <p className="text-[10px] text-white/20">
                  Photos from{" "}
                  {source === "pexels"
                    ? <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="underline">Pexels</a>
                    : <a href="https://pixabay.com" target="_blank" rel="noopener noreferrer" className="underline">Pixabay</a>
                  }.
                </p>
                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loadingMore || uploading !== null}
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white disabled:opacity-40 transition-colors"
                  >
                    {loadingMore ? <Loader2 size={11} className="animate-spin" /> : null}
                    {loadingMore ? "Loading..." : "Load more"}
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Image URL</label>
              <div className="relative">
                <Link2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                <input
                  ref={inputRef}
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-lg pl-8 pr-4 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Alt text</label>
              <input
                value={altInput}
                onChange={(e) => setAltInput(e.target.value)}
                placeholder="Describe the image..."
                className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20"
              />
            </div>
            {urlInput && (
              <div className="rounded-lg overflow-hidden aspect-video bg-white/[0.04]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={urlInput} alt={altInput} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            )}
            <button
              onClick={handleUrlInsert}
              disabled={!urlInput}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-sm font-medium rounded hover:bg-white/90 disabled:opacity-40 transition-colors"
            >
              <Upload size={13} /> Insert Image
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
