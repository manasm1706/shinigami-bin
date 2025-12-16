import API_BASE_URL from './api';

export interface ProphecyData {
  title: string;
  date: string;
}

export interface ProphecyResponse {
  id: string;
  title: string;
  date: string;
  originalTitle: string;
  ominousTitle: string;
  ominousDescription: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface GetPropheciesResponse {
  count: number;
  prophecies: ProphecyResponse[];
  message: string;
  timeframe?: string;
}

export interface CreateProphecyResponse {
  success: boolean;
  prophecy: ProphecyResponse;
  message: string;
}

/**
 * Create a new prophecy
 * @param prophecyData - Prophecy data with title and date
 * @returns Promise with the created prophecy
 */
export async function createProphecy(prophecyData: ProphecyData): Promise<ProphecyResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/prophecies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prophecyData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details?.join(', ') || error.error || 'Failed to create prophecy');
    }
    
    const data: CreateProphecyResponse = await response.json();
    return data.prophecy;
  } catch (error) {
    console.error('Error creating prophecy:', error);
    throw error;
  }
}

/**
 * Get all prophecies
 * @returns Promise with prophecies array
 */
export async function getProphecies(): Promise<ProphecyResponse[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/prophecies`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch prophecies');
    }
    
    const data: GetPropheciesResponse = await response.json();
    return data.prophecies;
  } catch (error) {
    console.error('Error fetching prophecies:', error);
    throw error;
  }
}

/**
 * Get prophecies by date range
 * @param startDate - Start date in ISO format
 * @param endDate - End date in ISO format
 * @returns Promise with filtered prophecies
 */
export async function getPropheciesByDateRange(startDate: string, endDate: string): Promise<ProphecyResponse[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/prophecies?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch prophecies');
    }
    
    const data: GetPropheciesResponse = await response.json();
    return data.prophecies;
  } catch (error) {
    console.error('Error fetching prophecies by date range:', error);
    throw error;
  }
}

/**
 * Get upcoming prophecies (next 7 days)
 * @returns Promise with upcoming prophecies
 */
export async function getUpcomingProphecies(): Promise<ProphecyResponse[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/prophecies/upcoming`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch upcoming prophecies');
    }
    
    const data: GetPropheciesResponse = await response.json();
    return data.prophecies;
  } catch (error) {
    console.error('Error fetching upcoming prophecies:', error);
    throw error;
  }
}

/**
 * Delete a prophecy
 * @param id - Prophecy ID to delete
 * @returns Promise with deletion result
 */
export async function deleteProphecy(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/prophecies/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete prophecy');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting prophecy:', error);
    throw error;
  }
}