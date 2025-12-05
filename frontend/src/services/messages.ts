import API_BASE_URL from './api';

export interface MessagePayload {
  sender: string;
  text: string;
  realm: string;
}

export interface MessageResponse {
  id: string;
  sender: string;
  text: string;
  realm: string;
  timestamp: string;
}

export interface GetMessagesResponse {
  realm: string;
  count: number;
  messages: MessageResponse[];
}

export interface SendMessageResponse {
  success: boolean;
  message: MessageResponse;
}

/**
 * Fetch messages filtered by realm
 * @param realm - The realm to filter messages by (living, beyond, unknown)
 * @returns Promise with messages array
 */
export async function getMessages(realm: string): Promise<MessageResponse[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/messages?realm=${encodeURIComponent(realm)}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch messages');
    }
    
    const data: GetMessagesResponse = await response.json();
    return data.messages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

/**
 * Send a new message to the backend
 * @param payload - Message data with sender, text, and realm
 * @returns Promise with the created message
 */
export async function sendMessage(payload: MessagePayload): Promise<MessageResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details?.join(', ') || error.error || 'Failed to send message');
    }
    
    const data: SendMessageResponse = await response.json();
    return data.message;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Get all messages (debug endpoint)
 * @returns Promise with all messages
 */
export async function getAllMessages(): Promise<MessageResponse[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/all`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch all messages');
    }
    
    const data = await response.json();
    return data.messages;
  } catch (error) {
    console.error('Error fetching all messages:', error);
    throw error;
  }
}

/**
 * Check API health
 * @returns Promise with health status
 */
export async function checkHealth(): Promise<{ status: string; service: string; timestamp: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking health:', error);
    throw error;
  }
}
