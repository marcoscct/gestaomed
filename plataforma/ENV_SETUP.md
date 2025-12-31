# Environment Setup

To run this project, you need to configure the Google Sheets API credentials.

1.  Copy the structure below into a new file named `.env.local` in the `plataforma` directory.
2.  Fill in the values from your Google Cloud Console Service Account.

```bash
# Google Sheets API Credentials
GOOGLE_CLIENT_EMAIL="gestao-medicina@gestao-medicina.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDCY0mO7Kse6BNY\nKIvqQ2GIBiWX0Ny6EPTUmr69mNjRfsvHWJBm6/YvWbPRzOgsL8wIGyy2Stg0+d+K\ntKmdAbRGt7JH87d5BxXdx4VOLH6T463E5FVDPTn6Y85G8VFf65miKTQy8uJs8gF+\njGHnCoZexy6r7WDQX0Nhn3Ssnte4x7DRQHQGsrIuYe0GwH7+gZxJH+PFCE9WsYsh\n7l0sQnvV7l0l9biq88O4BWhcsSK1q2XS+tAvhtqXBqVE6HMX4at3AaTKXJCO6/3u\nlPHrKHuGDXMP6MdO7O0dXR8tqK4GXl+25TDe1SWTqNUFeshmw3GUdAMijnk4SkqC\neaBxx1qNAgMBAAECggEAPFR8W/NwGKOGfXH4GrjW6FSgDkIwfz8L/YAZetaZVEu6\nCyCdkJPjUEbS3GZwGGatOEbW1azc9XQnwPDZQ3Vn8hrJJjOp2dItIyvtX5nHnzam\nk9kZ7UhvWhrnxnTXAKIqiH2pSbbAN3fUpuYC7KYDlh7TiWCfD4zBaOcIWxrhcONd\n7aP9NIN0w0oPz+4stNuPE0/CN2hu5UpRDaQZiJWNtwJx/H5oalyFi0yNGmlERRSG\nnP4VUEXVToOrU/UISZNJxVJlb3uK/AbvSlTA1EUWbZXL9VUqjlKDxfTwLczjNoK8\nS1tWfV3ph2KvUbfDByZWysmU+DtOtbL6Rwd76w93sQKBgQD3wokhii/9UQsdjc4t\ny7VRttlivkOIh4eHWrTV6JKkbscnYF6LrgqD8G6evFjOG9gj5cpAiNX26+I/q+p7\nMgGbyLbM3AFbdR8pyNyeDQowC1Vywl38DDjgnnfe9eMfuI28RruQmWV0N8/YfmmK\nPEy9pUt9K+nJACjfgbWFw3pRjwKBgQDI2lWEn3DrQIgotSIV9J6hRzoZoUq2oIe5\n36CK+zPqYCc/c4ZMi0XIannvcqcvnmWC2fMP2Rig9UltThNPqlLNxc0MkUH0Nmv5\no0cdOzsbq0xLrdYcOGttGaT8HjvaFFkJKEaZ3mBz0mfHW+8ZoTVU664J/krJerbw\nvfzOE0yMIwKBgEDKHHYq3tXNhaya0pnjNW1C9aH+w0ZGushIjhWKFh7t4SKI7vBz\n+Mf77dGQy2BKo8DvbG5n2hwSHz4rRMwmjYkhebwkpC44eIfCwP6Lxmg97oBuF4m7\n4HvMtOgXQOegqV/c11u+4Wr81Vt14z+E+UR2n0ECZMZtRkL8dm2earQ9AoGAEed0\njBfyZuYfvRE4cqCVq2bABRzdnh39O1J16y2tWQ0tMnjH1fbsR4tGR1P/Fz2Vau6m\nvhjqGx8CZp35FrbmHrWtK5ufN3fKdDxb0H1BLZw9dtmOJoHZAaaxkE/Zof0CWtCe\nSoUKMAjne1v0mmJGcMV5hCaI4CDyQc+Nw4jw3+UCgYBmmrNI65zu1Xttn6WhXruy\n3MenaWOS5SeO4lAXPSkMMU72HbvnWz6LuYeYGx0Q2CAx4dj+JREh35UET7PGvbw5\nCXNaSzMcjcyJ0l4AbRau1v0B4h/udRlTVM4dnRKD6Io6z35nEx0MsmFW8QRMdYT8\npaLUI+JGE4GzV4Qktz5z1g==\n-----END PRIVATE KEY-----\n"

# The ID of the Spreadsheet you want to manage
SHEET_ID="your-spreadsheet-id-here"
```

## How to get credentials:
1. Go to Google Cloud Console.
2. Create a new Project.
3. Enable "Google Sheets API".
4. Go to "Credentials" > "Create Credentials" > "Service Account".
5. Create a key (JSON) for that service account.
6. Open the JSON file and copy the `client_email` and `private_key`.
7. **Important:** Share your Google Sheet with the `client_email` address (give "Editor" access).
