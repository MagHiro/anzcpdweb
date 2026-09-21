export function getRemainingSeats(capacity: number | null, activeReservations: number): number | null {
  if (capacity === null) return null;
  return Math.max(capacity - activeReservations, 0);
}

export function canReserveSeat(capacity: number | null, activeReservations: number): boolean {
  return capacity === null || activeReservations < capacity;
}
