import React from 'react';

interface DownloadItemProps {
  id: string;
  filename: string;
  progress: number;
  speed: string;
  status: string;
  error?: string;
  onCancel: (id: string) => void;
}

export const DownloadItem: React.FC<DownloadItemProps> = ({ id, filename, progress, speed, status, error, onCancel }) => {
  const isError = status.includes('Error') || !!error;
  const isDownloading = status === 'Downloading' || status === 'Processing';

  return (
    <div className={`bg-slate-800/80 p-4 rounded-lg flex flex-col gap-2 border ${isError ? 'border-red-500/50' : 'border-slate-700'}`}>
      <div className="flex justify-between items-center text-sm">
        <span className="truncate max-w-[70%] font-medium" title={filename}>{filename}</span>
        {isDownloading && (
          <button
            onClick={() => onCancel(id)}
            className="text-xs bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-2 py-1 rounded border border-red-500/20 transition"
          >
            Cancel
          </button>
        )}
      </div>

      {!isError ? (
        <>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs">{speed}</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>{status}</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
        </>
      ) : (
        <div className="text-red-400 text-xs mt-1 break-words">
          <span className="font-bold">Error:</span> {error || 'Unknown Error'}
        </div>
      )}
    </div>
  );
};
