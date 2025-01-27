"use server"

import { contactFormSchema } from "@/lib/schema"
import { appendToSheet } from "@/lib/sheets"
import { z } from "zod"

export async function contactFormAction(_prevState: unknown, formData: FormData) {
  const defaultValues = z.record(z.string(), z.string()).parse(Object.fromEntries(formData.entries()))

  try {
    const data = contactFormSchema.parse(Object.fromEntries(formData))

    // Store the form submission in Google Sheets
    const result = await appendToSheet(data);
    console.log("Form submission successful:", result); // Log the result or use it as needed


    return {
      defaultValues: {
        name: "",
        email: "",
        message: "",
      },
      success: true,
      errors: null,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        defaultValues,
        success: false,
        errors: Object.fromEntries(
          Object.entries(error.flatten().fieldErrors).map(([key, value]) => [key, value?.join(", ")]),
        ),
      }
    }

    console.error("Form submission error:", error)
    return {
      defaultValues,
      success: false,
      errors: {
        form: "Failed to submit form. Please try again later.",
      },
    }
  }
}

