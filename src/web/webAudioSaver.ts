/** Uploads an audio file to /api/audio and returns the blob URL as the id. */
export function makeWebAudioSaver(password: string) {
  return async (file: File): Promise<{ id: string; name: string }> => {
    const res = await fetch('/api/audio', {
      method: 'POST',
      headers: {
        'content-type': file.type || 'application/octet-stream',
        'x-admin-password': password,
        'x-filename': file.name,
      },
      body: file,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `Upload failed (${res.status})`);
    }
    const data = await res.json();
    if (!data?.url) throw new Error('Upload response missing url');
    return { id: data.url, name: file.name };
  };
}
