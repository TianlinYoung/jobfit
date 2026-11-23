// Lets the user save generated text (the JSON export) as a file, without any server.

export function downloadTextFile(fileName: string, text: string, mimeType: string): void {
  // A Blob is an in-memory file. We give it a temporary URL, click a hidden link to it, then free the URL.
  const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
