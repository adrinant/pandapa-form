import { google } from "googleapis";

// Initialize Google Sheets and Drive clients
const auth = new google.auth.GoogleAuth({
  credentials: {
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? "",
    client_email: "competition-form@pandapa-form.iam.gserviceaccount.com",
  },
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive", // Required for sharing
  ],
});

const sheets = google.sheets({ version: "v4", auth });

// The existing spreadsheet ID and sheet name
const SPREADSHEET_ID: string | null = "your-existing-spreadsheet-id"; // Set this to your existing spreadsheet ID
const SHEET_NAME = "Competitions";
const SPREADSHEET_URL_TEMPLATE = "https://docs.google.com/spreadsheets/d/{id}";

// Ensure that the private key is set, and throw an error if not
if (!process.env.GOOGLE_SHEETS_PRIVATE_KEY || !process.env.GOOGLE_SHEETS_PRIVATE_KEY.trim()) {
  throw new Error("Private key for Google Sheets API is not set in environment variables.");
}

export async function appendToSheet(data: { name: string; email: string; message: string }) {
  try {
    // If the spreadsheet is not set, you can either throw an error or return early.
    if (!SPREADSHEET_ID) {
      throw new Error("Spreadsheet ID is not set. Please provide a valid spreadsheet ID.");
    }

    // Format the data as a row
    const values = [[data.name, data.email, data.message, new Date().toISOString()]];

    // Append the row to the sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:D`, // Assumes the sheet already exists with columns A-D
      valueInputOption: "RAW",
      requestBody: {
        values,
      },
    });

    console.log("Data appended to sheet:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error appending to sheet:", error);
    throw error;
  }
}

// Example function to log the spreadsheet URL for reference
export function getSpreadsheetUrl(): string {
  if (!SPREADSHEET_ID) {
    throw new Error("Spreadsheet ID is not set.");
  }
  return SPREADSHEET_URL_TEMPLATE.replace("{id}", SPREADSHEET_ID);
}
