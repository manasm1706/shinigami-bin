import { apiFetch } from './api';
import type { Community, CommunityChannel } from '../types';

export function getCommunities(): Promise<{ communities: Community[] }> {
  return apiFetch('/communities');
}

export function createCommunity(data: {
  name: string;
  description?: string;
  icon?: string;
  isPublic?: boolean;
}): Promise<{ community: Community }> {
  return apiFetch('/communities', { method: 'POST', body: JSON.stringify(data) });
}

export function joinCommunity(id: string): Promise<{ message: string; alreadyMember?: boolean }> {
  return apiFetch(`/communities/${id}/join`, { method: 'POST' });
}

export function leaveCommunity(id: string): Promise<{ message: string }> {
  return apiFetch(`/communities/${id}/leave`, { method: 'POST' });
}

export function getCommunityChannels(id: string): Promise<{ channels: CommunityChannel[] }> {
  return apiFetch(`/communities/${id}/channels`);
}

export function createCommunityChannel(
  communityId: string,
  data: { name: string; description?: string }
): Promise<{ channel: CommunityChannel }> {
  return apiFetch(`/communities/${communityId}/channels`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
