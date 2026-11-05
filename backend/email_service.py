import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

def is_gmail_configured():
    """Checks whether Gmail sending credentials exist in environment."""
    user = os.getenv("GMAIL_USER") or os.getenv("SMTP_USER")
    password = os.getenv("GMAIL_APP_PASSWORD") or os.getenv("SMTP_PASSWORD")
    return bool(user and password)

def send_notification_email(recipient_email, subject, task_details, event_type="notification"):
    """
    Sends a formatted email notification for TaskFlow events.
    Events: 'created', 'assigned', 'completed'
    Returns a dict with success boolean and details or error message.
    """
    user = os.getenv("GMAIL_USER") or os.getenv("SMTP_USER")
    password = os.getenv("GMAIL_APP_PASSWORD") or os.getenv("SMTP_PASSWORD")

  
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))

    if not is_gmail_configured():
        return {
            "success": False,
            "configured": False,
            "error": "Gmail notification credentials missing. Configure GMAIL_USER and GMAIL_APP_PASSWORD in backend/.env to enable automated emails."
        }

    if not recipient_email:
        return {
            "success": False,
            "configured": True,
            "error": "Recipient email address is missing or user has no registered email."
        }

    title = task_details.get("title", "Untitled Task")
    description = task_details.get("description", "No description provided.")
    status = task_details.get("status", "pending")
    assignee = task_details.get("assignee_name") or task_details.get("assigned_to_email") or "Unassigned"
    due_date = task_details.get("due_date") or "None set"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Plaintext body
    plain_text = f"""
TaskFlow Notification: {subject}
==================================================

Task Title:   {title}
Status:       {status.upper()}
Assigned To:  {assignee}
Due Date:     {due_date}
Date & Time:  {timestamp}

Description:
{description}

==================================================
This is an automated notification from TaskFlow.
"""

    # Modern styled HTML body
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }}
    .card {{ background: #ffffff; max-width: 540px; margin: 0 auto; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
    .header {{ background: #2563eb; color: #ffffff; padding: 20px 24px; }}
    .header h2 {{ margin: 0; font-size: 20px; font-weight: 600; }}
    .body {{ padding: 24px; }}
    .badge {{ display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; background: #e0e7ff; color: #3730a3; }}
    .badge-completed {{ background: #dcfce7; color: #166534; }}
    .badge-in_progress {{ background: #fef3c7; color: #92400e; }}
    .field {{ margin-bottom: 16px; }}
    .field-label {{ font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; margin-bottom: 4px; }}
    .field-value {{ font-size: 15px; color: #0f172a; font-weight: 500; }}
    .description-box {{ background: #f1f5f9; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #2563eb; font-size: 14px; color: #334155; }}
    .footer {{ background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2>TaskFlow Update</h2>
    </div>
    <div class="body">
      <div class="field">
        <span class="badge {'badge-completed' if status == 'completed' else ('badge-in_progress' if status == 'in_progress' else '')}">{status.replace('_', ' ')}</span>
      </div>
      <div class="field">
        <div class="field-label">Task Title</div>
        <div class="field-value" style="font-size: 18px; font-weight: 700;">{title}</div>
      </div>
      <div class="field">
        <div class="field-label">Description</div>
        <div class="description-box">{description}</div>
      </div>
      <div class="field">
        <div class="field-label">Assigned User</div>
        <div class="field-value">{assignee}</div>
      </div>
      <div class="field">
        <div class="field-label">Due Date</div>
        <div class="field-value">{due_date}</div>
      </div>
      <div class="field">
        <div class="field-label">Notification Timestamp</div>
        <div class="field-value">{timestamp}</div>
      </div>
    </div>
    <div class="footer">
      Sent automatically by TaskFlow Management System
    </div>
  </div>
</body>
</html>
"""

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[TaskFlow] {subject}"
        msg["From"] = f"TaskFlow <{user}>"
        msg["To"] = recipient_email

        part1 = MIMEText(plain_text, "plain")
        part2 = MIMEText(html_content, "html")
        msg.attach(part1)
        msg.attach(part2)

        with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(user, password)
            server.sendmail(user, [recipient_email], msg.as_string())

        return {"success": True, "configured": True, "message": f"Email delivered to {recipient_email}"}

    except Exception as e:
        return {"success": False, "configured": True, "error": f"Failed to send email: {str(e)}"}

