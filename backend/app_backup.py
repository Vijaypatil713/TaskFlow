import os
from datetime import datetime, timezone
from flask import Flask, jsonify, request
from flask_cors import CORS
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend/.env is loaded regardless of invocation directory
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

from supabase_client import supabase
from email_service import send_notification_email, is_gmail_configured

app = Flask(__name__)

# Configure CORS to allow Next.js frontend (port 3000) and any local development port
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

def get_authenticated_user():
    """Extracts and verifies JWT Bearer token from Authorization header."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    return supabase.verify_auth_token(token)

@app.route("/")
def index():
    return jsonify({
        "app": "TaskFlow REST API",
        "version": "1.0.0",
        "status": "online",
        "documentation": "/api/health"
    })

@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint: verifies Flask, Supabase connectivity, and Gmail notification status."""
    db_health = supabase.health_check()
    gmail_ready = is_gmail_configured()

    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_health,
        "email_notifications": {
            "configured": gmail_ready,
            "provider": "Gmail SMTP / OAuth" if gmail_ready else "Not configured (set GMAIL_USER & GMAIL_APP_PASSWORD in backend/.env)"
        }
    }), 200

@app.route("/api/users", methods=["GET"])
def get_users():
    """Retrieves all registered user profiles for task assignment."""
    try:
        users = supabase.get_users()
        return jsonify({
            "success": True,
            "count": len(users),
            "users": users
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Failed to retrieve registered users",
            "error": str(e)
        }), 500

@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    """Retrieves tasks with optional query filters (status, assigned_to, created_by)."""
    try:
        status = request.args.get("status")
        assigned_to = request.args.get("assigned_to")
        created_by = request.args.get("created_by")

        # Validate status filter if provided
        valid_statuses = ("pending", "in_progress", "completed")
        if status and status not in valid_statuses:
            return jsonify({
                "success": False,
                "message": f"Invalid status filter. Allowed values: {', '.join(valid_statuses)}"
            }), 400

        tasks = supabase.get_tasks(status=status, assigned_to=assigned_to, created_by=created_by)
        return jsonify({
            "success": True,
            "count": len(tasks),
            "tasks": tasks
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Failed to retrieve tasks",
            "error": str(e)
        }), 500

@app.route("/api/tasks/<task_id>", methods=["GET"])
def get_task(task_id):
    """Retrieves a single task by ID."""
    try:
        task = supabase.get_task(task_id)
        if not task:
            return jsonify({
                "success": False,
                "message": f"Task with ID {task_id} not found"
            }), 404
        return jsonify({
            "success": True,
            "task": task
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Failed to fetch task",
            "error": str(e)
        }), 500

@app.route("/api/tasks", methods=["POST"])
def create_task():
    """Creates a new task and dispatches notification if assigned."""
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"success": False, "message": "Invalid JSON body"}), 400

        title = data.get("title", "").strip()
        if not title:
            return jsonify({"success": False, "message": "Title is required and cannot be empty"}), 400

        status = data.get("status", "pending")
        if status not in ("pending", "in_progress", "completed"):
            return jsonify({"success": False, "message": "Status must be pending, in_progress, or completed"}), 400

        # Optional user authentication
        auth_user = get_authenticated_user()
        created_by = auth_user.get("id") if auth_user else data.get("created_by")

        task_payload = {
            "title": title,
            "description": data.get("description", "").strip(),
            "status": status,
            "assigned_to": data.get("assigned_to") or None,
            "due_date": data.get("due_date") or None,
        }
        if created_by:
            task_payload["created_by"] = created_by

        created_task = supabase.create_task(task_payload)

        # Handle notification if task is assigned
        notification_result = None
        assignee_id = task_payload.get("assigned_to")
        assignee_email = data.get("assigned_to_email")

        # Attempt to lookup assignee email from profiles if not sent directly
        if assignee_id and not assignee_email:
            try:
                users = supabase.get_users()
                for u in users:
                    if u.get("id") == assignee_id:
                        assignee_email = u.get("email")
                        break
            except Exception:
                pass

        if assignee_email:
            notification_result = send_notification_email(
                recipient_email=assignee_email,
                subject=f"New Task Assigned: {title}",
                task_details={
                    "title": title,
                    "description": task_payload["description"],
                    "status": status,
                    "assignee_name": data.get("assignee_name", assignee_email),
                    "due_date": task_payload["due_date"]
                },
                event_type="assigned"
            )

        return jsonify({
            "success": True,
            "message": "Task created successfully",
            "task": created_task,
            "notification": notification_result
        }), 201

    except ValueError as ve:
        return jsonify({"success": False, "message": str(ve)}), 400
    except Exception as e:
        return jsonify({"success": False, "message": "Internal error creating task", "error": str(e)}), 500

@app.route("/api/tasks/<task_id>", methods=["PUT"])
def update_task(task_id):
    """Updates all editable fields of an existing task."""
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"success": False, "message": "Invalid JSON body"}), 400

        existing = supabase.get_task(task_id)
        if not existing:
            return jsonify({"success": False, "message": f"Task {task_id} not found"}), 404

        title = data.get("title", existing.get("title", "")).strip()
        if not title:
            return jsonify({"success": False, "message": "Title cannot be empty"}), 400

        status = data.get("status", existing.get("status", "pending"))
        if status not in ("pending", "in_progress", "completed"):
            return jsonify({"success": False, "message": "Status must be pending, in_progress, or completed"}), 400

        updates = {
            "title": title,
            "description": data.get("description", existing.get("description", "")),
            "status": status,
            "assigned_to": data.get("assigned_to", existing.get("assigned_to")),
            "due_date": data.get("due_date", existing.get("due_date")),
        }

        # Handle completed timestamp
        if status == "completed" and existing.get("status") != "completed":
            updates["completed_at"] = datetime.now(timezone.utc).isoformat()
        elif status != "completed":
            updates["completed_at"] = None

        updated_task = supabase.update_task(task_id, updates)

        # Notify if assignment changed or completed
        notification_result = None
        assignee_email = data.get("assigned_to_email")
        if updates.get("assigned_to") and not assignee_email:
            try:
                users = supabase.get_users()
                for u in users:
                    if u.get("id") == updates["assigned_to"]:
                        assignee_email = u.get("email")
                        break
            except Exception:
                pass

        if status == "completed" and existing.get("status") != "completed" and assignee_email:
            notification_result = send_notification_email(
                recipient_email=assignee_email,
                subject=f"Task Completed: {title}",
                task_details=updated_task,
                event_type="completed"
            )

        return jsonify({
            "success": True,
            "message": "Task updated successfully",
            "task": updated_task,
            "notification": notification_result
        }), 200

    except ValueError as ve:
        return jsonify({"success": False, "message": str(ve)}), 400
    except Exception as e:
        return jsonify({"success": False, "message": "Failed to update task", "error": str(e)}), 500

@app.route("/api/tasks/<task_id>/status", methods=["PATCH"])
def update_task_status(task_id):
    """Quickly updates task status (pending, in_progress, completed) and logs completion time."""
    try:
        data = request.get_json(silent=True) or {}
        new_status = data.get("status")

        if not new_status or new_status not in ("pending", "in_progress", "completed"):
            return jsonify({
                "success": False,
                "message": "Valid 'status' required ('pending', 'in_progress', or 'completed')"
            }), 400

        existing = supabase.get_task(task_id)
        if not existing:
            return jsonify({"success": False, "message": f"Task {task_id} not found"}), 404

        updates = {"status": new_status}
        if new_status == "completed":
            updates["completed_at"] = datetime.now(timezone.utc).isoformat()
        else:
            updates["completed_at"] = None

        updated_task = supabase.update_task(task_id, updates)

        # Send completion email if completed
        notification_result = None
        if new_status == "completed":
            assignee_email = data.get("assigned_to_email")
            if not assignee_email and existing.get("assigned_to"):
                try:
                    users = supabase.get_users()
                    for u in users:
                        if u.get("id") == existing["assigned_to"]:
                            assignee_email = u.get("email")
                            break
                except Exception:
                    pass

            if assignee_email:
                notification_result = send_notification_email(
                    recipient_email=assignee_email,
                    subject=f"Task Completed: {existing.get('title')}",
                    task_details=updated_task,
                    event_type="completed"
                )

        return jsonify({
            "success": True,
            "message": f"Task status updated to {new_status}",
            "task": updated_task,
            "notification": notification_result
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": "Failed to update status", "error": str(e)}), 500

@app.route("/api/tasks/<task_id>", methods=["DELETE"])
def delete_task(task_id):
    """Deletes a task by ID."""
    try:
        existing = supabase.get_task(task_id)
        if not existing:
            return jsonify({"success": False, "message": f"Task {task_id} not found"}), 404

        supabase.delete_task(task_id)
        return jsonify({
            "success": True,
            "message": f"Task {task_id} deleted successfully"
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": "Failed to delete task", "error": str(e)}), 500

@app.route("/api/notify/test", methods=["POST"])
def test_notification():
    """Manual trigger to test email configuration and sending."""
    data = request.get_json(silent=True) or {}
    recipient = data.get("email")
    if not recipient:
        return jsonify({"success": False, "message": "Recipient 'email' is required"}), 400

    result = send_notification_email(
        recipient_email=recipient,
        subject="Test Notification from TaskFlow",
        task_details={
            "title": "Sample Verification Task",
            "description": "This is a test notification to verify your TaskFlow Gmail configuration.",
            "status": "pending",
            "assignee_name": "Test User",
            "due_date": datetime.now().strftime("%Y-%m-%d")
        },
        event_type="test"
    )

    status_code = 200 if result.get("success") else (400 if not result.get("configured") else 500)
    return jsonify(result), status_code

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug_mode = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1")
    print(f"TaskFlow Backend starting on http://localhost:{port} (debug={debug_mode})")
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
