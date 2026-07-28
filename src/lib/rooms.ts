import { Track } from './store';

export interface RoomMember {
  id: string;
  name: string;
  avatar: string;
}

export interface Room {
  id: string;
  code: string;
  queue: Track[];
  currentIndex: number;
  isPlaying: boolean;
  positionSeconds: number;
  positionUpdatedAt: string;
  members: RoomMember[];
}

async function postJson(url: string, method: string, body: unknown) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}

export async function createRoomRemote(
  profileId: string, queue: Track[], currentIndex: number, isPlaying: boolean, positionSeconds: number
): Promise<Room | null> {
  const { ok, data } = await postJson('/api/rooms', 'POST', { profileId, queue, currentIndex, isPlaying, positionSeconds });
  return ok ? data.room : null;
}

export async function joinRoomRemote(code: string, profileId: string): Promise<Room | { error: string }> {
  const { ok, data } = await postJson('/api/rooms/join', 'POST', { code, profileId });
  return ok ? data.room : { error: data.error || 'Room tidak ditemukan' };
}

export async function fetchRoomRemote(roomId: string): Promise<Room | null> {
  try {
    const res = await fetch(`/api/rooms/${roomId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.room;
  } catch {
    return null;
  }
}

export async function syncRoomRemote(
  roomId: string, state: { queue: Track[]; currentIndex: number; isPlaying: boolean; positionSeconds: number }
): Promise<boolean> {
  const { ok } = await postJson(`/api/rooms/${roomId}`, 'PUT', state);
  return ok;
}

export async function leaveRoomRemote(roomId: string, profileId: string): Promise<boolean> {
  const { ok } = await postJson(`/api/rooms/${roomId}/leave`, 'POST', { profileId });
  return ok;
}
