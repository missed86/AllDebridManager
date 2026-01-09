import React, { useState } from 'react';
import type { Magnet } from '../types';
import { api } from '../alldebrid';
import { Toast } from './Toast';

interface MagnetListProps {
  magnets: Magnet[];
  onDownloadStart: () => void;
}

export const MagnetList: React.FC<MagnetListProps> = ({ magnets, onDownloadStart }) => {
  const [renames, setRenames] = useState<Record<string, string>>({});
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const handleDownload = async (link: string, originalName: string, category: "movies" | "series", id: string) => {
    if (downloadingIds.has(id)) return;

    setDownloadingIds(prev => new Set(prev).add(id));
    const finalName = renames[link] || originalName;

    try {
      const res = await api.download(link, finalName, category);
      if (res.status === 'success') {
        setToast({ msg: `Started downloading: ${finalName}`, type: 'success' });
        onDownloadStart();
        // We keep it in downloadingIds so the button triggers "Downloading" state permanently for this session
        // or until the list refreshes and maybe we want to unblock it? 
        // Actually, better to keep it blocked to prevent double clicks.
      } else {
        setToast({ msg: `Error: ${res.error || 'Unknown error'}`, type: 'error' });
        setDownloadingIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } catch (e) {
      setToast({ msg: "Failed to start download", type: 'error' });
      setDownloadingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleNameChange = (link: string, newName: string) => {
    setRenames(prev => ({ ...prev, [link]: newName }));
  };

  // Flatten the list to show individual files (links) if ready, or the magnet itself if processing
  const rows = [];

  if (magnets) {
    for (const m of magnets) {
      if (m.status === 'Ready' && m.links && m.links.length > 0) {
        for (const l of m.links) {
          rows.push({
            type: 'file',
            id: m.id + l.link, // unique key
            name: l.filename,
            originalName: l.filename,
            link: l.link,
            size: m.size, // Approximate, usually main file is mostly the size
            status: 'Ready',
            magnetName: m.filename
          });
        }
      } else {
        // Show magnet progress
        rows.push({
          type: 'magnet',
          id: m.id,
          name: m.filename,
          size: m.size,
          status: m.status,
          magnetName: m.filename
        });
      }
    }
  }

  return (
    <div className="overflow-x-auto bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl relative">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <table className="w-full text-left text-sm text-slate-400">
        <thead className="bg-slate-700/50 text-slate-200 font-medium uppercase text-xs">
          <tr>
            <th className="px-6 py-4">Filename</th>
            <th className="px-6 py-4">Size</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-center w-[200px]">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-700/30 transition-colors">
              <td className="px-6 py-4 font-medium text-slate-200">
                {row.type === 'file' ? (
                  <div className="flex flex-col gap-1">
                    <input
                      type="text"
                      value={renames[row.link!] !== undefined ? renames[row.link!] : row.name}
                      onChange={(e) => handleNameChange(row.link!, e.target.value)}
                      className="bg-transparent border-b border-dashed border-slate-600 focus:border-blue-500 focus:outline-none w-full max-w-md py-1"
                    />
                    <span className="text-[10px] text-slate-500">Source: {row.magnetName}</span>
                  </div>
                ) : (
                  <span>{row.name}</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {(row.size / 1024 / 1024 / 1024).toFixed(2)} GB
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 rounded-full text-xs border ${row.status === 'Ready' ? 'bg-green-500/10 border-green-500 text-green-400' :
                    'bg-yellow-500/10 border-yellow-500 text-yellow-400'
                  }`}>
                  {row.status}
                </span>
              </td>
              <td className="px-6 py-4 flex items-center justify-center gap-2">
                {row.type === 'file' && (
                  <>
                    {!downloadingIds.has(row.id) ? (
                      <>
                        <button
                          onClick={() => handleDownload(row.link!, row.originalName!, 'movies', row.id)}
                          className="px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 rounded transition text-xs font-semibold"
                        >
                          Movies
                        </button>
                        <button
                          onClick={() => handleDownload(row.link!, row.originalName!, 'series', row.id)}
                          className="px-3 py-1.5 bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white border border-purple-500/30 rounded transition text-xs font-semibold"
                        >
                          Series
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-medium text-blue-400 animate-pulse">
                        Downloading...
                      </span>
                    )}
                  </>
                )}
                {row.type === 'magnet' && (
                  <span className="text-xs italic text-slate-600">Processing...</span>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">
                No active files found. Upload a torrent to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
