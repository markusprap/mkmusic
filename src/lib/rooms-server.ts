import type { SupabaseClient } from '@supabase/supabase-js';
import { Room, RoomMember } from './rooms';

export async function fetchRoomMembers(supabase: SupabaseClient, roomId: string): Promise<RoomMember[]> {
  const { data } = await supabase
    .from('room_members')
    .select('profiles(id, name, avatar)')
    .eq('room_id', roomId);
  return (data ?? []).map((m: any) => m.profiles);
}

export function toRoomResponse(room: any, members: RoomMember[]): Room {
  return {
    id: room.id,
    code: room.code,
    queue: room.queue,
    currentIndex: room.current_index,
    isPlaying: room.is_playing,
    positionSeconds: room.position_seconds,
    positionUpdatedAt: room.position_updated_at,
    members,
  };
}
