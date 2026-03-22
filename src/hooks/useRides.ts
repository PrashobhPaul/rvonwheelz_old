import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRides, createRide, removeRide, fetchRequests, createRequest, setRequestStatus } from "@/lib/api";
import { Ride, RideRequest } from "@/lib/types";

export function useRides() {
  return useQuery({
    queryKey: ["rides"],
    queryFn: fetchRides,
    refetchInterval: 15000, // poll every 15s for multi-user updates
  });
}

export function useRequests(rideId?: string) {
  return useQuery({
    queryKey: ["requests", rideId],
    queryFn: () => fetchRequests(rideId),
    refetchInterval: 10000,
  });
}

export function useCreateRide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ride: Omit<Ride, "id" | "createdAt">) => createRide(ride),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rides"] }),
  });
}

export function useDeleteRide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, phone }: { id: string; phone: string }) => removeRide(id, phone),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rides"] });
      qc.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}

export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: Omit<RideRequest, "id" | "status" | "requestedAt">) => createRequest(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["requests"] }),
  });
}

export function useUpdateRequestStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RideRequest["status"] }) => setRequestStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["requests"] }),
  });
}
