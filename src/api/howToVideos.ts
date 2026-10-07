import { api } from '@/api/client';
import type { HowToVideo } from '@/types/admin';

export async function fetchHowToVideos() {
  const { data } = await api.get<HowToVideo[]>('/how-to-videos');
  return data;
}
