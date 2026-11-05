import os
import requests
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend/.env is located regardless of current working directory
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()

if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL is missing from backend/.env")
if not SUPABASE_KEY:
    raise ValueError("SUPABASE_SERVICE_ROLE_KEY is missing from backend/.env")

class SupabaseRestClient:
    """
    Direct, robust REST client for Supabase using standard PostgREST and Auth APIs.
    Bypasses client-side browser restrictions by using a standard backend User-Agent.
    """
    def __init__(self, url: str, key: str):
        self.url = url
        self.key = key
        self.session = requests.Session()
        self.session.headers.update({
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "User-Agent": "TaskFlow-Backend/1.0",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        })

    def _rest_url(self, table: str) -> str:
        return f"{self.url}/rest/v1/{table}"

    def health_check(self) -> dict:
        """Checks connection to Supabase REST endpoint."""
        try:
            res = self.session.get(
                f"{self.url}/rest/v1/",
                headers={"Accept": "application/openapi+json"},
                timeout=5
            )
            if res.status_code == 200:
                return {"connected": True, "status": "Supabase reachable"}
            return {"connected": False, "status": f"Status code: {res.status_code}", "error": res.text}
        except Exception as e:
            return {"connected": False, "status": "Connection error", "error": str(e)}

    def verify_auth_token(self, token: str) -> dict | None:
        """
        Verifies Supabase user JWT via Supabase Auth API.
        Returns user dict if valid, None if invalid.
        """
        if not token:
            return None
        try:
            auth_url = f"{self.url}/auth/v1/user"
            res = requests.get(
                auth_url,
                headers={
                    "apikey": self.key,
                    "Authorization": f"Bearer {token}",
                    "User-Agent": "TaskFlow-Backend/1.0"
                },
                timeout=5
            )
            if res.status_code == 200:
                return res.json()
            return None
        except Exception:
            return None

    def get_users(self) -> list:
        """Fetches registered user profiles."""
        url = self._rest_url("profiles")
        params = {"select": "*", "order": "created_at.desc"}
        res = self.session.get(url, params=params, timeout=5)
        if res.status_code in (200, 206):
            return res.json()
        elif res.status_code in (404, 403, 401):
            # If profiles table doesn't exist yet, return empty list with warning
            return []
        res.raise_for_status()
        return res.json()

    def get_tasks(self, status: str = None, assigned_to: str = None, created_by: str = None) -> list:
        """Fetches tasks with optional filtering."""
        url = self._rest_url("tasks")
        params = {"select": "*", "order": "created_at.desc"}
        if status:
            params["status"] = f"eq.{status}"
        if assigned_to:
            params["assigned_to"] = f"eq.{assigned_to}"
        if created_by:
            params["created_by"] = f"eq.{created_by}"

        res = self.session.get(url, params=params, timeout=5)
        if res.status_code in (200, 206):
            return res.json()
        res.raise_for_status()
        return res.json()

    def get_task(self, task_id: str) -> dict | None:
        """Fetches a single task by ID."""
        url = self._rest_url("tasks")
        params = {"id": f"eq.{task_id}", "select": "*"}
        res = self.session.get(url, params=params, timeout=5)
        if res.status_code in (200, 206):
            data = res.json()
            return data[0] if data else None
        res.raise_for_status()
        return None

    def create_task(self, task_data: dict) -> dict:
        """Inserts a new task into tasks table."""
        url = self._rest_url("tasks")
        res = self.session.post(url, json=task_data, timeout=5)
        if res.status_code in (200, 201):
            data = res.json()
            return data[0] if data else task_data
        # Capture error detail from PostgREST
        try:
            err = res.json()
            msg = err.get("message") or err.get("hint") or res.text
        except Exception:
            msg = res.text
        raise ValueError(f"Failed to create task ({res.status_code}): {msg}")

    def update_task(self, task_id: str, updates: dict) -> dict:
        """Updates an existing task by ID."""
        url = self._rest_url("tasks")
        params = {"id": f"eq.{task_id}"}
        res = self.session.patch(url, params=params, json=updates, timeout=5)
        if res.status_code in (200, 204):
            data = res.json() if res.text else updates
            return data[0] if isinstance(data, list) and data else data
        try:
            err = res.json()
            msg = err.get("message") or err.get("hint") or res.text
        except Exception:
            msg = res.text
        raise ValueError(f"Failed to update task ({res.status_code}): {msg}")

    def delete_task(self, task_id: str) -> bool:
        """Deletes a task by ID."""
        url = self._rest_url("tasks")
        params = {"id": f"eq.{task_id}"}
        res = self.session.delete(url, params=params, timeout=5)
        if res.status_code in (200, 204):
            return True
        try:
            err = res.json()
            msg = err.get("message") or res.text
        except Exception:
            msg = res.text
        raise ValueError(f"Failed to delete task ({res.status_code}): {msg}")

# Initialize singleton instance
supabase = SupabaseRestClient(SUPABASE_URL, SUPABASE_KEY)
