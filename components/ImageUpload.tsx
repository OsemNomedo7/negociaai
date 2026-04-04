"use client";

import { useRef, useState } from "react";

interface Props {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  accept?: string;
}

export default function ImageUpload({ label, value, onChange, hint, accept = "image/*" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setError("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erro ao fazer upload.");
    } else {
      onChange(data.url);
    }
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function handleClear() {
    onChange("");
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>

      {value ? (
        <div className="relative border-2 border-gray-200 rounded-xl overflow-hidden group">
          <img
            src={value}
            alt={label}
            className="w-full h-32 object-contain bg-gray-50 p-2"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 bg-white text-gray-800 text-xs font-bold rounded-lg hover:bg-gray-100"
            >
              Trocar
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600"
            >
              Remover
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-indigo-500">
              <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span className="text-sm font-medium">Enviando...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <span className="text-3xl">🖼️</span>
              <p className="text-sm font-medium text-gray-500">
                Clique ou arraste a imagem aqui
              </p>
              <p className="text-xs text-gray-400">JPG, PNG, WebP, SVG • máx. 5MB</p>
            </div>
          )}
        </div>
      )}

      {/* URL manual */}
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ou cole uma URL de imagem..."
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 focus:border-indigo-400 transition-colors"
        />
      </div>

      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleInput}
      />
    </div>
  );
}
