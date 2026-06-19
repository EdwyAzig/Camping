export function mapSupabaseError(message: string, code?: string): string {
  if (
    code === "PGRST205" ||
    message.includes("Could not find the table")
  ) {
    return "Database non configurato. Esegui `npm run db:migrate` per creare le tabelle.";
  }
  if (
    code === "PGRST202" ||
    message.includes("Could not find the function")
  ) {
    return "Funzioni database mancanti. Esegui `npm run db:migrate`.";
  }
  if (message.includes("Invalid JWT")) {
    return "Chiave API non valida. Controlla .env.local (publishable o anon key).";
  }
  return message;
}
