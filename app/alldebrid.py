import os
import aiohttp
import asyncio
from typing import Optional, List, Dict, Any

class AllDebrid:
    BASE_URL = "https://api.alldebrid.com"
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("ALLDEBRID_API_KEY")
        self.session = None

    async def get_session(self):
        if self.session is None:
            self.session = aiohttp.ClientSession()
        return self.session

    async def close(self):
        if self.session:
            await self.session.close()

    async def _request(self, method: str, endpoint: str, params: Dict = None, data: Any = None) -> Dict:
        if not self.api_key and not endpoint == "/user/login":
             pass
             
        session = await self.get_session()
        
        url = f"{self.BASE_URL}{endpoint}"
        query_params = {"agent": "CasaOSManager"}
        if self.api_key:
            query_params["apikey"] = self.api_key
            
        if params:
            query_params.update(params)

        async with session.request(method, url, params=query_params, data=data) as response:
            try:
                res_json = await response.json()
                return res_json
            except:
                return {"status": "error", "error": f"HTTP {response.status}: {await response.text()}"}

    async def get_magnets(self) -> Dict:
        """
        Get list of magnets.
        Endpoint: /v4.1/magnet/status
        """
        return await self._request("GET", "/v4.1/magnet/status")
        
    async def get_files(self, magnet_ids: List[str]) -> Dict:
        """
        Get files/links for specific magnets.
        Endpoint: /v4.1/magnet/files
        """
        data = []
        for mid in magnet_ids:
            data.append(("id[]", str(mid)))
            
        return await self._request("POST", "/v4.1/magnet/files", data=data)

    async def upload_magnet(self, magnets: List[str]) -> Dict:
        """
        Upload magnet links.
        Endpoint: /v4/magnet/upload
        """
        return await self._request("POST", "/v4/magnet/upload", data={"magnets[]": magnets})

    async def upload_torrent(self, file_content: bytes) -> Dict:
        """
        Upload torrent file.
        Endpoint: /v4/magnet/upload/file
        """
        data = aiohttp.FormData()
        data.add_field('files[]', file_content, filename='upload.torrent', content_type='application/x-bittorrent')
        return await self._request("POST", "/v4/magnet/upload/file", data=data)
        
    async def unlock_link(self, link: str) -> Dict:
        """
        Unlock a link.
        Endpoint: /v4/link/unlock
        """
        return await self._request("GET", "/v4/link/unlock", params={"link": link})

    async def delete_magnet(self, magnet_id: str) -> Dict:
         return await self._request("GET", "/v4/magnet/delete", params={"id": magnet_id})
