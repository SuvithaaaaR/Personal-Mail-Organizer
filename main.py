import base64
import json
import os
from email import message_from_bytes

from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

# Gmail permission
SCOPES = ['https://www.googleapis.com/auth/gmail.modify']


# ---------------- AUTHENTICATION ----------------
def authenticate_gmail():
    creds = None

    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES
            )
            creds = flow.run_local_server(port=0)

        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    return build('gmail', 'v1', credentials=creds)


# ---------------- GET OR CREATE LABEL ----------------
def get_or_create_label(service, label_name):
    labels = service.users().labels().list(userId='me').execute().get('labels', [])

    for label in labels:
        if label['name'].lower() == label_name.lower():
            return label['id']

    label_body = {
        'name': label_name,
        'labelListVisibility': 'labelShow',
        'messageListVisibility': 'show'
    }

    new_label = service.users().labels().create(
        userId='me', body=label_body
    ).execute()

    return new_label['id']


# ---------------- READ EMAIL TEXT ----------------
def read_email_text(service, msg_id):
    msg = service.users().messages().get(
        userId='me', id=msg_id, format='raw'
    ).execute()

    raw_data = base64.urlsafe_b64decode(msg['raw'].encode('ASCII'))
    email_message = message_from_bytes(raw_data)

    subject = email_message.get('Subject', '').lower()
    body = ""

    if email_message.is_multipart():
        for part in email_message.walk():
            if part.get_content_type() == "text/plain":
                body = part.get_payload(decode=True).decode(errors='ignore').lower()
                break
    else:
        body = email_message.get_payload(decode=True).decode(errors='ignore').lower()

    return subject + " " + body


# ---------------- MAIN LOGIC ----------------
def main():
    print("🔐 Authenticating Gmail...")
    service = authenticate_gmail()

    print("📂 Loading keywords...")
    with open('keywords.json', 'r') as f:
        keywords = json.load(f)

    print("📥 Reading inbox emails...")
    messages = []
    page_token = None
    
    # Fetch all emails with pagination
    while True:
        results = service.users().messages().list(
            userId='me', 
            labelIds=['INBOX'], 
            maxResults=100,
            pageToken=page_token
        ).execute()
        
        messages.extend(results.get('messages', []))
        page_token = results.get('nextPageToken')
        
        if not page_token:
            break
    
    print(f"📊 Found {len(messages)} emails to process...")

    if not messages:
        print("✅ No new emails found.")
        return

    for msg in messages:
        try:
            email_text = read_email_text(service, msg['id'])
            email_organized = False

            for label_name, words in keywords.items():
                if email_organized:
                    break
                    
                for word in words:
                    if word.lower() in email_text:
                        label_id = get_or_create_label(service, label_name)

                        service.users().messages().modify(
                            userId='me',
                            id=msg['id'],
                            body={
                                'addLabelIds': [label_id],
                                'removeLabelIds': ['INBOX']
                            }
                        ).execute()

                        print(f"📌 Email moved to: {label_name}")
                        email_organized = True
                        break
        
        except Exception as e:
            print(f"❌ Error processing email {msg['id']}: {str(e)}")
            continue

    print("🎉 Email organization complete!")


# ---------------- RUN ----------------
if __name__ == "__main__":
    main()
