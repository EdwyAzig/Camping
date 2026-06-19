export function mapSupabaseError(message: string, code?: string): string {
  if (
    code === "PGRST205" ||
    message.includes("Could not find the table")
  ) {
    return "errors.dbNotConfigured";
  }
  if (
    code === "PGRST202" ||
    message.includes("Could not find the function")
  ) {
    return "errors.dbFunctionsMissing";
  }
  if (message.includes("Invalid JWT")) {
    return "errors.invalidApiKey";
  }
  return message;
}
