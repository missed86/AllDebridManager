import asyncio
import aiohttp
import aiofiles
import os
import time
from typing import Dict, Any

# Store task info for API
download_tasks: Dict[str, Dict[str, Any]] = {}
# Store actual asyncio tasks for cancellation
active_async_tasks: Dict[str, asyncio.Task] = {}

class Downloader:
    def __init__(self, download_dir: str):
        self.download_dir = download_dir

    async def start_download(self, url: str, filename: str, task_id: str, target_dir: str):
        if not os.path.exists(target_dir):
            os.makedirs(target_dir, exist_ok=True)
            
        download_tasks[task_id] = {
            "filename": filename,
            "progress": 0,
            "speed": "0 KB/s",
            "status": "Downloading",
            "size": 0,
            "downloaded": 0,
            "eta": "--",
            "error": None
        }
        
        # Store reference to current task
        active_async_tasks[task_id] = asyncio.current_task()
        
        final_path = os.path.join(target_dir, filename)
        temp_path = final_path + ".tmp"
        
        try:
            # Disable timeout for long downloads
            timeout = aiohttp.ClientTimeout(total=None)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(url) as response:
                    if response.status != 200:
                        raise Exception(f"HTTP {response.status}")
                        
                    total_size = int(response.headers.get('content-length', 0))
                    download_tasks[task_id]["size"] = total_size
                    
                    downloaded = 0
                    start_time = time.time()
                    
                    async with aiofiles.open(temp_path, mode='wb') as f:
                        async for chunk in response.content.iter_chunked(1024 * 1024): # 1MB chunks
                            await f.write(chunk)
                            downloaded += len(chunk)
                            
                            elapsed = time.time() - start_time
                            # Avoid div by zero and ensure we have some elapsed time
                            if elapsed > 0:
                                bps = downloaded / elapsed
                                speed = bps
                                
                                # ETA Calculation
                                if total_size > 0 and bps > 0:
                                    remaining_bytes = total_size - downloaded
                                    seconds_left = int(remaining_bytes / bps)
                                    # Format ETA
                                    m, s = divmod(seconds_left, 60)
                                    h, m = divmod(m, 60)
                                    if h > 0:
                                        eta_str = f"{h}h {m:02d}m"
                                    else:
                                        eta_str = f"{m:02d}m {s:02d}s"
                                    download_tasks[task_id]["eta"] = eta_str
                                else:
                                    download_tasks[task_id]["eta"] = "--"
                            else:
                                speed = 0
                                download_tasks[task_id]["eta"] = "Calc..."
                            
                            download_tasks[task_id]["downloaded"] = downloaded
                            download_tasks[task_id]["speed"] = f"{speed / 1024 / 1024:.2f} MB/s"
                            if total_size:
                                download_tasks[task_id]["progress"] = int((downloaded / total_size) * 100)
            
            # Rename to final filename on success
            if os.path.exists(final_path):
                os.remove(final_path) # Overwrite if exists, or maybe we should have checked before? For now overwrite is standard.
            os.rename(temp_path, final_path)
                                
            download_tasks[task_id]["status"] = "Completed"
            download_tasks[task_id]["progress"] = 100
            
        except asyncio.CancelledError:
            download_tasks[task_id]["status"] = "Cancelled"
            download_tasks[task_id]["speed"] = "0 KB/s"
            # Cleanup partial file
            if os.path.exists(temp_path):
                os.remove(temp_path)
        except Exception as e:
            download_tasks[task_id]["status"] = "Error"
            download_tasks[task_id]["error"] = f"{type(e).__name__}: {str(e)}"
            download_tasks[task_id]["speed"] = "0 KB/s"
            # Cleanup partial file
            if os.path.exists(temp_path):
                os.remove(temp_path)
        finally:
            if task_id in active_async_tasks:
                del active_async_tasks[task_id]

    def cancel_task(self, task_id: str):
        if task_id in active_async_tasks:
            active_async_tasks[task_id].cancel()
            return True
        return False
