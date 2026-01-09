import React, { useCallback, useState } from 'react';
import { api } from '../alldebrid';

interface UploadZoneProps {
  onUploadSuccess: () => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.torrent')) {
        await uploadFile(file);
      }
    } else {
      // Maybe it's text (magnet link)?
      const text = e.dataTransfer.getData("text");
      if (text && text.startsWith("magnet:?")) {
        await uploadMagnet(text);
      }
    }
  }, []);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      await api.uploadFile(file);
      onUploadSuccess();
    } catch (e) {
      console.error(e);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const uploadMagnet = async (magnet: string) => {
    setUploading(true);
    try {
      await api.uploadMagnet(magnet);
      onUploadSuccess();
    } catch (e) {
      console.error(e);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText();
    if (text.startsWith("magnet:?")) {
      uploadMagnet(text);
    } else {
      alert("Clipboard does not contain a magnet link");
    }
  }

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`
        p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer
        flex flex-col items-center justify-center gap-2
        ${isDragging ? 'border-blue-400 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'}
      `}
    >
      {uploading ? (
        <div className="animate-pulse">Uploading...</div>
      ) : (
        <>
          <p className="text-xl font-medium text-slate-200">Drop .torrent here</p>
          <p className="text-sm text-slate-400">or paste a magnet link</p>
          <button
            onClick={handlePaste}
            className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-semibold transition"
          >
            Paste Magnet Link
          </button>
        </>
      )}
    </div>
  );
};
