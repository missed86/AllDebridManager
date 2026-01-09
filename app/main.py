from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
import os
import shutil

# Import modules
from app.alldebrid import AllDebrid
from app.downloader import Downloader, download_tasks

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize
ad = AllDebrid()
downloader = Downloader(download_dir="/downloads" if os.getenv("DOCKER_ENV") else "./downloads")

# Models
class MagnetLink(BaseModel):
    magnet: str

class DownloadRequest(BaseModel):
    link: str
    filename: str
    category: str # "movies" or "series"

def clean_filename(filename: str) -> str:
    import re
    # Separate extension
    base, ext = os.path.splitext(filename)
    
    # Remove content inside []
    name = re.sub(r'\[.*?\]', '', base)
    
    # Remove extra spaces
    name = " ".join(name.split())
    
    # Rejoin with extension
    return f"{name.strip()}{ext}"

VIDEO_EXTENSIONS = ('.mkv', '.mp4', '.avi', '.mov', '.wmv', '.flv')

# API Endpoints
@app.get("/api/magnets")
async def get_magnets():
    if not ad.api_key or ad.api_key == "mock": 
        # Mock Data
        return {
            "status": "success",
            "data": {
                "magnets": [
                    {"id": "1", "filename": "Ubuntu_22_04.iso", "status": "Ready", "size": 3500000000, "links": [{"link": "https://mock.com/ubuntu.iso", "filename": "Ubuntu_22_04.iso"}]},
                    {"id": "2", "filename": "BigBuckBunny_4K.mp4", "status": "Downloading", "size": 800000000, "downloaded": 400000000},
                ]
            }
        }
        
    # 1. Get Status
    status_res = await ad.get_magnets()
    if status_res.get("status") != "success":
        return status_res
        
    magnets = status_res.get("data", {}).get("magnets", [])
    
    # 2. Collect Ready IDs
    ready_ids = [m["id"] for m in magnets if m.get("statusCode") == 4] # statusCode 4 is Ready
    
    if ready_ids:
        files_res = await ad.get_files(ready_ids)
        if files_res.get("status") == "success":
            files_map = {str(m["id"]): m.get("files", []) for m in files_res.get("data", {}).get("magnets", [])}
            
            # 3. Merge Files/Links
            for m in magnets:
                mid = str(m["id"])
                if mid in files_map:
                    # helper function to extract links
                    m["links"] = []
                    
                    def extract_links(items):
                        links = []
                        for item in items:
                            if "l" in item and item["l"]:
                                # Filter Video Files
                                if item["n"].lower().endswith(VIDEO_EXTENSIONS):
                                    # Clean Name
                                    cleaned = clean_filename(item["n"])
                                    links.append({"link": item["l"], "filename": cleaned})
                            if "e" in item: # sub-entities/folders
                                links.extend(extract_links(item["e"]))
                        return links

                    m["links"] = extract_links(files_map[mid])

    return {"status": "success", "data": {"magnets": magnets}}

@app.post("/api/upload")
async def upload_magnet_or_file(magnet: Optional[str] = None, file: Optional[UploadFile] = File(None)):
    if file:
        content = await file.read()
        return await ad.upload_torrent(content)
    elif magnet:
        return await ad.upload_magnet([magnet])
    else:
        raise HTTPException(status_code=400, detail="No magnet link or file provided")

@app.post("/api/download")
async def start_download_task(req: DownloadRequest, background_tasks: BackgroundTasks):
    # Determine Path
    base_path = "/downloads"
    if req.category == "movies":
        base_path = os.getenv("DOWNLOAD_PATH_MOVIES", "/downloads/movies")
    elif req.category == "series":
        base_path = os.getenv("DOWNLOAD_PATH_SERIES", "/downloads/series")
        
    # 1. Unlock link
    if not ad.api_key or ad.api_key == "mock":
        unlocked = {"status": "success", "data": {"link": req.link}} # Mock
    else:
        unlocked = await ad.unlock_link(req.link)
    
    if unlocked.get("status") != "success":
        raise HTTPException(status_code=400, detail="Failed to unlock link")
        
    download_url = unlocked["data"]["link"]
    task_id = str(uuid.uuid4())
    
    # 2. Start Background Download
    background_tasks.add_task(downloader.start_download, download_url, req.filename, task_id, base_path)
    
    return {"status": "success", "task_id": task_id}

@app.get("/api/tasks")
async def get_tasks():
    return download_tasks

@app.get("/api/health")
async def health():
    return {"status": "ok"}

# Serve Frontend (React)
# In development, we might not have 'dist', but in prod we will.
if os.path.exists("app/dist"):
    app.mount("/", StaticFiles(directory="app/dist", html=True), name="static")
elif os.path.exists("dist"):
     app.mount("/", StaticFiles(directory="dist", html=True), name="static")
