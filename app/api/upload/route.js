import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { isStorageConfigured, uploadImage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

const MAX_FILES = 6;
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB per file

export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  if (!isStorageConfigured()) {
    return NextResponse.json({ error: 'STORAGE_NOT_CONFIGURED' }, { status: 503 });
  }

  const { allowed } = rateLimit({ key: `upload:${user.id}`, limit: 30, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json({ error: 'Too many uploads. Try again later.' }, { status: 429 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll('files').filter((f) => typeof f === 'object' && f.size > 0);
    const folder = formData.get('folder') === 'avatars' ? 'avatars' : 'listings';

    if (!files.length) return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    if (files.length > MAX_FILES) return NextResponse.json({ error: `Maximum ${MAX_FILES} files` }, { status: 400 });

    for (const f of files) {
      if (f.size > MAX_SIZE) {
        return NextResponse.json({ error: `"${f.name}" exceeds the 10 MB limit` }, { status: 400 });
      }
    }

    // sharp re-encodes every file; corrupt or non-image data throws here,
    // so no separate MIME sniffing is needed
    const urls = await Promise.all(
      files.map(async (f) => uploadImage(Buffer.from(await f.arrayBuffer()), { folder }))
    );

    return NextResponse.json({ urls });
  } catch (err) {
    console.error('[upload]', err.message);
    return NextResponse.json({ error: 'Upload failed — make sure files are valid images' }, { status: 400 });
  }
}
