import { google } from "googleapis";

// Initialize Google Sheets and Drive clients
const auth = new google.auth.GoogleAuth({
  credentials: {
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? "",
    client_email: "pandapa-form@pandapa-form.iam.gserviceaccount.com",
  },
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive", // Required for sharing
  ],
});

const sheets = google.sheets({ version: "v4", auth });
const drive = google.drive({ version: "v3", auth });

// The existing spreadsheet ID and sheet name
const SPREADSHEET_ID = "1c1RJzlXQrOBinYlDaKC-KJ1HhRPflefomNfJDXzb8dY"; // Replace with your existing spreadsheet ID
const SHEET_NAME = "Competitions"; // Replace with the exact name of your sheet
const SPREADSHEET_URL_TEMPLATE = "https://docs.google.com/spreadsheets/d/{id}";

// Ensure that the private key is set, and throw an error if not
if (!process.env.GOOGLE_SHEETS_PRIVATE_KEY || !process.env.GOOGLE_SHEETS_PRIVATE_KEY.trim()) {
  throw new Error("Private key for Google Sheets API is not set in environment variables.");
}

// Share the existing spreadsheet with an email (if needed)
async function shareSpreadsheetWithEmail(email: string) {
  try {
    if (!SPREADSHEET_ID) throw new Error("Spreadsheet ID is not set.");

    await drive.permissions.create({
      fileId: SPREADSHEET_ID,
      requestBody: {
        role: "writer", // Grants edit access
        type: "user",
        emailAddress: email,
      },
    });

    console.log(`Spreadsheet shared with ${email}`);
  } catch (error) {
    console.error("Error sharing spreadsheet:", error);
    throw error;
  }
}

export async function appendToSheet(data: { name: string; email: string; message: string }) {
  try {
    // If the spreadsheet is not set, throw an error
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