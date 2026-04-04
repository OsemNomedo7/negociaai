"use client";

import { useRef, useState } from "react";

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
}

const MAX = 5;

export default function BannerCarouselEditor({ images, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [urlInput, setUrlInput] = useState("");

  async function uploadFile(file: File) {
    setError("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erro no upload.");
    } else {
      onChange([...images, data.url].slice(0, MAX));
    }
    setUploading(false);
  }

  async function handleFiles(files: FileList) {
    const slots = MAX - images.length;
    const toUpload = Array.from(files).slice(0, slots);
    for (const f of toUpload) await uploadFile(f);
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }

  function remove(idx: number) {
    onChange(images.filter((_, i) => i !== idx));
  }

  function addUrl() {
    const url = urlInput.trim();
    if (!url || images.length >= MAX) return;
    onChange([...images, url]);
    setUrlInput("");
  }

  // Drag-to-reorder
  function dragStart(idx: number) { setDraggingIdx(idx); }
  function dragEnter(idx: number) {
    if (draggingIdx === null || draggingIdx === idx) return;
    const reordered = [...images];
    const [moved] = reordered.splice(draggingIdx, 1);
    reordered.splice(idx, 0, moved);
    setDraggingIdx(idx);
    onChange(reordered);
  }
  function dragEnd() { setDraggingIdx(null); }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-700">
            Imagens do banner{" "}
            <span className="font-normal text-gray-400">({images.length}/{MAX})</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Arraste para reordenar • Clique no ✕ para remover</p>
        </div>
        {images.length < MAX && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Enviando...
              </>
            ) : (
              <>+ Adicionar imagem</>
            )}
          </button>
        )}
      </div>

      {/* Grid de miniaturas */}
      {images.length > 0 ? (
        <div className="grid grid-cols-5 gap-2">
          {images.map((src, idx) => (
            <div
              key={src + idx}
              draggable
              onDragStart={() => dragStart(idx)}
              onDragEnter={() => dragEnter(idx)}
              onDragEnd={dragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`relative group rounded-xl overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all aspect-video ${
                draggingIdx === idx ? "opacity-50 scale-95 border-indigo-400" : "border-gray-200 hover:border-indigo-300"
              }`}
            >
              <img src={src} alt={`Banner ${idx + 1}`} className="w-full h-full object-cover" />
              {/* Número */}
              <div className="absolute top-1 left-1 w-5 h-5 bg-black/60 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {idx + 1}
              </div>
              {/* Remover */}
              <button
                type="button"
                onClick={() => remove(idx)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                ✕
              </button>
              {/* Drag handle visual */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent h-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1">
                <span className="text-white text-xs">⠿ mover</span>
              </div>
            </div>
          ))}

          {/* Slot vazio */}
          {images.length < MAX && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => inputRef.current?.click()}
              className={`aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                dragOver ? "border-indigo-400 bg-indigo-50" : "border-gray-300 hover:border-indigo-300 hover:bg-gray-50"
              }`}
            >
              <span className="text-xl">+</span>
              <span className="text-xs text-gray-400 mt-0.5">Adicionar</span>
            </div>
          )}
        </div>
      ) : (
        /* Drop zone quando vazio */
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragOver ? "border-indigo-400 bg-indigo-50" : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
          }`}
        >
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <span className="text-4xl">🖼️</span>
            <p className="text-sm font-medium text-gray-500">Arraste as imagens ou clique para selecionar</p>
            <p className="text-xs">Até {MAX} imagens • JPG, PNG, WebP, GIF • máx. 5MB cada</p>
          </div>
        </div>
      )}

      {/* Adicionar por URL */}
      <div className="flex gap-2">
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addUrl()}
          placeholder="Ou cole uma URL de imagem e pressione Enter..."
          disabled={images.length >= MAX}
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 focus:border-indigo-400 transition-colors disabled:opacity-50"
        />
        <button
          type="button"
          onClick={addUrl}
          disabled={!urlInput.trim() || images.length >= MAX}
          className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-colors disabled:opacity-40"
        >
          Adicionar URL
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleInput}
      />
    </div>
  );
}
