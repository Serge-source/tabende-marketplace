// Converts uploaded files to base64 data URLs stored in the database.
// This avoids reliance on the ephemeral Railway filesystem.
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB per image

export async function saveUploadedFile(file) {
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error(`Image "${file.name}" exceeds 2MB limit.`);
  }
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');
  const mimeType = file.type || 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}

export async function saveMultipleFiles(formData, field) {
  const files = formData.getAll(field);
  const urls = [];
  for (const file of files) {
    if (file instanceof File && file.size > 0) {
      const url = await saveUploadedFile(file);
      urls.push(url);
    }
  }
  return urls;
}
