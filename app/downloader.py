import asyncio
import aiohttp
import aiofiles
import os
import time

# Global task store
# Structure: { task_id: { "filename": str, "progress": float, "speed": str, "status": str, "size": int, "downloaded": int } }
download_tasks = {}

class Downloader:
    def __init__(self, download_dir: str = "/downloads"):
        self.download_dir = download_dir
        if not os.path.exists(self.download_dir):
            os.makedirs(self.download_dir)

    async def start_download(self, url: str, filename: str, task_id: str, target_dir: str):
        if not os.path.exists(target_dir):
            os.makedirs(target_dir, exist_ok=True)
            
        download_tasks[task_id] = {
            "filename": filename,
            "progress": 0,
            "speed": "0 KB/s",
            "status": "Downloading",
            "size": 0,
            "downloaded": 0
        }
        
        file_path = os.path.join(target_dir, filename)
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status != 200:
                        download_tasks[task_id]["status"] = "Error"
                        return

                    total_size = int(response.headers.get("Content-Length", 0))
                    download_tasks[task_id]["size"] = total_size
                    
                    chunk_size = 1024 * 1024 # 1MB
                    downloaded = 0
                    start_time = time.time()
                    
                    async with aiofiles.open(file_path, 'wb') as f:
                        async for chunk in response.content.iter_chunked(chunk_size):
                            await f.write(chunk)
                            downloaded += len(chunk)
                            
                            # Update stats
                            elapsed = time.time() - start_time
                            speed = (downloaded / (elapsed + 0.001)) / 1024 / 1024 # MB/s
                            
                            download_tasks[task_id]["downloaded"] = downloaded
                            download_tasks[task_id]["progress"] = (downloaded / total_size) * 100 if total_size > 0 else 0
                            download_tasks[task_id]["speed"] = f"{speed:.2f} MB/s"
                    
                    download_tasks[task_id]["status"] = "Completed"
                    download_tasks[task_id]["progress"] = 100
                    
        except Exception as e:
            print(f"Download error: {e}")
            download_tasks[task_id]["status"] = f"Error: {str(e)}"

