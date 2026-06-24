import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function saveUploadedFile(file) {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadsDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name) || '.jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const filepath = path.join(uploadsDir, filename);
  await writeFile(filepath, buffer);
  return `/uploads/${filename}`;
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
