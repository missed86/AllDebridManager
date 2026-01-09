import React from 'react';

interface DownloadItemProps {
  filename: string;
  progress: number;
  speed: string;
  status: string;
}

export const DownloadItem: React.FC<DownloadItemProps> = ({ filename, progress, speed, status }) => {
  return (
    <div className="bg-slate-800/80 p-4 rounded-lg flex flex-col gap-2 border border-slate-700">
      <div className="flex justify-between items-center text-sm">
        <span className="truncate max-w-[70%] font-medium">{filename}</span>
        <span className="text-slate-400 text-xs">{speed}</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${status === 'Error' ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{status}</span>
        <span>{progress.toFixed(1)}%</span>
      </div>
    </div>
  );
};
