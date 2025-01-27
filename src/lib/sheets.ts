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

// We’ll store the spreadsheet ID in memory - in production you'd want to store this in a database
let SPREADSHEET_ID: string | null = null;
const SHEET_NAME = "Form Responses";
const SPREADSHEET_URL_TEMPLATE = "https://docs.google.com/spreadsheets/d/{id}";

// Ensure that the private key is set, and throw an error if not
if (!process.env.GOOGLE_SHEETS_PRIVATE_KEY || !process.env.GOOGLE_SHEETS_PRIVATE_KEY.trim()) {
  throw new Error("Private key for Google Sheets API is not set in environment variables.");
}

async function createSpreadsheet() {
  try {
    // Create a new spreadsheet
    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: "Pandapa Form Responses",
        },
        sheets: [
          {
            properties: {
              title: SHEET_NAME,
            },
          },
        ],
      },
    });

    // Store the spreadsheet ID
    SPREADSHEET_ID = response.data.spreadsheetId ?? null;
    if (!SPREADSHEET_ID) {
      throw new Error("Failed to retrieve spreadsheet ID after creation.");
    }
    console.log("Created new spreadsheet with ID:", SPREADSHEET_ID);

    return SPREADSHEET_ID;
  } catch (error) {
    console.error("Error creating spreadsheet:", error);
    throw error;
  }
}

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
    // Create spreadsheet if it doesn't exist
    if (!SPREADSHEET_ID) {
      SPREADSHEET_ID = await createSpreadsheet();
      // Share with a default email (this can be parameterized)
      await shareSpreadsheetWithEmail("adrinanttt@gmail.com"); // Replace with the desired email
    }

    // Format the data as a row
    const values = [[data.name, data.email, data.message, new Date().toISOString()]];

    // Append the row to the sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:D`,
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
