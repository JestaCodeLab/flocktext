import axios from 'axios';
import { adminApi } from '@/api/adminClient';
import type { HowToVideo, HowToVideoPlatform } from '@/types/admin';

export async function fetchAdminHowToVideos() {
  const { data } = await adminApi.get<HowToVideo[]>('/admin/how-to-videos');
  return data;
}

interface UploadSignature {
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  uploadUrl: string;
}

export interface UploadedVideo {
  publicId: string;
  videoUrl: string;
  duration: number;
}

// Uploads straight from the browser to Cloudinary with a signature from our API - the
// file never passes through the API server.
export async function uploadHowToVideoFile(file: File, onProgress: (percent: number) => void): Promise<UploadedVideo> {
  const { data: sig } = await adminApi.post<UploadSignature>('/admin/how-to-videos/upload-signature');

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('folder', sig.folder);
  form.append('signature', sig.signature);

  const { data } = await axios.post<{ public_id: string; secure_url: string; duration?: number }>(sig.uploadUrl, form, {
    onUploadProgress: (e) => e.total && onProgress(Math.round((e.loaded / e.total) * 100)),
  });
  return { publicId: data.public_id, videoUrl: data.secure_url, duration: Math.round(data.duration ?? 0) };
}

export interface CreateHowToVideoPayload extends UploadedVideo {
  title: string;
  description: string;
  platform: HowToVideoPlatform;
  published: boolean;
}

export async function createHowToVideo(payload: CreateHowToVideoPayload) {
  const { data } = await adminApi.post<HowToVideo>('/admin/how-to-videos', payload);
  return data;
}

export async function updateHowToVideo({
  id,
  ...payload
}: { id: string } & Partial<{ title: string; description: string; platform: HowToVideoPlatform; published: boolean; move: 'up' | 'down' }>) {
  const { data } = await adminApi.patch<HowToVideo>(`/admin/how-to-videos/${id}`, payload);
  return data;
}

export async function deleteHowToVideo(id: string) {
  const { data } = await adminApi.delete<{ deleted: true }>(`/admin/how-to-videos/${id}`);
  return data;
}
