import { google } from 'googleapis';

if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    console.warn("Google Sheets credentials are missing in environment variables.");
}

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
    ],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function getSheetData(spreadsheetId: string, range: string) {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });
        return response.data.values;
    } catch (error) {
        console.error("Error fetching sheet data:", error);
        throw error;
    }
}

export async function updateSheetData(spreadsheetId: string, range: string, values: any[][]) {
    try {
        const response = await sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error updating sheet data:", error);
        throw error;
    }
}

export async function batchUpdate(spreadsheetId: string, requests: any[]) {
    try {
        const response = await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error batch updating sheet:", error);
        throw error;
    }
}
