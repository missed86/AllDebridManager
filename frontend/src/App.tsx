import { useEffect, useState } from 'react';
import { api } from './alldebrid';
import type { Magnet, DownloadTask } from './types';
import { UploadZone } from './components/UploadZone';
import { MagnetList } from './components/MagnetList';
import { DownloadItem } from './components/DownloadItem';

function App() {
  const [magnets, setMagnets] = useState<Magnet[]>([]);
  const [tasks, setTasks] = useState<Record<string, DownloadTask>>({});

  const refreshMagnets = async () => {
    try {
      const res = await api.getMagnets();
      if (res.status === 'success' && res.data) {
        setMagnets(res.data.magnets);
      }
    } catch (e) {
      console.error("Failed to load magnets", e);
    }
  };

  const refreshTasks = async () => {
    try {
      const t = await api.getTasks();
      setTasks(t);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshMagnets();
    refreshTasks();
    const interval = setInterval(() => {
      refreshTasks(); // Update downloads often
      refreshMagnets();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const activeTasks = Object.entries(tasks);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-6 md:p-12 font-sans selection:bg-blue-500/30">
      <div className="w-full max-w-[98%] mx-auto space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              AllDebrid Manager
            </h1>
            <p className="text-slate-400 text-sm">CasaOS Edition</p>
          </div>
          <div className="flex gap-2 text-xs font-mono text-slate-500">
            <span className="px-2 py-1 bg-slate-800 rounded">v1.0.0</span>
          </div>
        </header>

        <section>
          <UploadZone onUploadSuccess={refreshMagnets} />
        </section>

        {activeTasks.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4 text-slate-300">Local Downloads</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeTasks.map(([id, task]) => (
                <DownloadItem key={id} {...task} />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-300">Cloud Files</h2>
            <button onClick={refreshMagnets} className="p-2 hover:bg-slate-800 rounded-full transition">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            </button>
          </div>
          <MagnetList magnets={magnets} onDownloadStart={refreshTasks} />
        </section>
      </div>
    </div>
  )
}

export default App
