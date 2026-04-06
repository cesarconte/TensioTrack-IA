import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Reading {
  id: string;
  systolic: number;
  diastolic: number;
  heartRate?: number;
  order: number;
  recordedAt: string;
  sessionId: string;
}

export const useReadings = () => {
  return useQuery<Reading[]>({
    queryKey: ['readings'],
    queryFn: async () => {
      const res = await fetch('/api/readings');
      if (!res.ok) throw new Error('Failed to fetch readings');
      return res.json();
    }
  });
};

export const useAddReading = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { systolic: number; diastolic: number; heartRate?: number; slot: 'morning' | 'evening'; date?: string }) => {
      const res = await fetch('/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add reading');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readings'] });
    }
  });
};
