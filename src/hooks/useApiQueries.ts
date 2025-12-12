import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import {
  apiClient,
  Device,
  PipelineSegment,
  LegacyPipelineSegment,
  Valve,
  Catastrophe,
  SurveyData,
  ValveOperation,
} from "../lib/api";
import { extendPipelines, withLegacyProperties } from "../lib/pipelineUtils";
import type { DeviceAssignment } from "@/types/admin";
import { useSurveyContext } from "@/contexts/SurveyContext";

// Query keys
export const QUERY_KEYS = {
  devices: "devices",
  deviceLogs: "deviceLogs",
  deviceAlerts: "deviceAlerts",
  device: "device",
  pipelines: "pipelines",
  pipeline: "pipeline",
  valves: "valves",
  valve: "valve",
  catastrophes: "catastrophes",
  catastrophe: "catastrophe",
  surveys: "surveys",
  survey: "survey",
  surveyMasters: "surveyMasters",
  surveyMaster: "surveyMaster",
  valveOperations: "valveOperations",
  valveOperation: "valveOperation",
  deviceAssignments: "deviceAssignments",
  deviceAssignment: "deviceAssignment",
  assignmentsBySurvey: "assignmentsBySurvey",
  assignmentConflicts: "assignmentConflicts",
  config: "config",
  catastropheTypes: "catastropheTypes",
  deviceTypes: "deviceTypes",
  valveTypes: "valveTypes",
  pipelineMaterials: "pipelineMaterials",
  statusOptions: "statusOptions",
  surveyCategories: "surveyCategories",
} as const;

// Device hooks
export function useDevices(params?: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.devices, params],
    queryFn: async () => {
      const response = await apiClient.getDevices(params);
      const items = Array.isArray(response?.data) ? response.data : [];
      return { ...response, data: items };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDeviceLogs(params?: { page?: number; limit?: number; status?: string; surveyId?: string; }) {
  const { currentSurvey } = useSurveyContext();
  const effectiveParams = React.useMemo(() => {
    const storedSurveyId = (() => {
      try {
        return (typeof localStorage !== "undefined" && localStorage.getItem("activeSurveyId")) || undefined;
      } catch {
        return undefined;
      }
    })();
    return {
      ...params,
      surveyId: params?.surveyId ?? currentSurvey?.id ?? storedSurveyId,
    };
  }, [params?.page, params?.limit, params?.status, params?.surveyId, currentSurvey?.id]);

  return useQuery({
    queryKey: [QUERY_KEYS.deviceLogs, effectiveParams],
    queryFn: () => apiClient.getDeviceLogs(effectiveParams),
    staleTime: 60 * 1000,
  });
}

export function useDeviceAlerts(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [QUERY_KEYS.deviceAlerts, params],
    queryFn: () => apiClient.getDeviceAlerts(params),
    staleTime: 30 * 1000,
  });
}

export function useDevice(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.device, id],
    queryFn: () => apiClient.getDevice(id),
    enabled: !!id,
  });
}

export function useCreateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (device: Parameters<typeof apiClient.createDevice>[0]) =>
      apiClient.createDevice(device),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.devices] });
    },
  });
}

export function useUpdateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, device }: { id: string; device: Parameters<typeof apiClient.updateDevice>[1] }) =>
      apiClient.updateDevice(id, device),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.devices] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.device, id] });
    },
  });
}

export function useDeleteDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.devices] });
    },
  });
}

// Pipeline hooks
export function usePipelines(params?: {
  page?: number;
  limit?: number;
  status?: string;
  material?: string;
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.pipelines, params],
    queryFn: async () => {
      const response = await apiClient.getPipelines(params);
      const items = Array.isArray(response?.data) ? response.data : [];
      return {
        ...response,
        data: extendPipelines(items)
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePipeline(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.pipeline, id],
    queryFn: async () => {
      const response = await apiClient.getPipeline(id);
      return {
        ...response,
        data: withLegacyProperties(response.data)
      };
    },
    enabled: !!id,
  });
}

export function useCreatePipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pipeline: Omit<PipelineSegment, "id">) =>
      apiClient.createPipeline(pipeline),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.pipelines] });
    },
  });
}

export function useUpdatePipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      pipeline,
    }: {
      id: string;
      pipeline: Partial<PipelineSegment>;
    }) => apiClient.updatePipeline(id, pipeline),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.pipelines] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.pipeline, id] });
    },
  });
}

export function useDeletePipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deletePipeline(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.pipelines] });
    },
  });
}

// Valve hooks
export function useValves(params?: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.valves, params],
    queryFn: async () => {
      const response = await apiClient.getValves(params);
      const items = Array.isArray(response?.data) ? response.data : [];
      return { ...response, data: items };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useValve(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.valve, id],
    queryFn: () => apiClient.getValve(id),
    enabled: !!id,
  });
}

export function useCreateValve() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (valve: Omit<Valve, "id">) => apiClient.createValve(valve),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.valves] });
    },
  });
}

export function useUpdateValve() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, valve }: { id: string; valve: Partial<Valve> }) =>
      apiClient.updateValve(id, valve),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.valves] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.valve, id] });
    },
  });
}

export function useDeleteValve() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteValve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.valves] });
    },
  });
}

// Catastrophe hooks
export function useCatastrophes(params?: {
  page?: number;
  limit?: number;
  status?: string;
  severity?: string;
  type?: string;
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.catastrophes, params],
    queryFn: async () => {
      const response = await apiClient.getCatastrophes(params);
      const items = Array.isArray(response?.data) ? response.data : [];
      return { ...response, data: items };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for more real-time updates
  });
}

export function useCatastrophe(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.catastrophe, id],
    queryFn: () => apiClient.getCatastrophe(id),
    enabled: !!id,
  });
}

export function useCreateCatastrophe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (catastrophe: Omit<Catastrophe, "id" | "reportedAt">) =>
      apiClient.createCatastrophe(catastrophe),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.catastrophes] });
    },
  });
}

export function useUpdateCatastrophe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      catastrophe,
    }: {
      id: string;
      catastrophe: Partial<Catastrophe>;
    }) => apiClient.updateCatastrophe(id, catastrophe),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.catastrophes] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.catastrophe, id] });
    },
  });
}

export function useDeleteCatastrophe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteCatastrophe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.catastrophes] });
    },
  });
}

// Survey hooks
export function useSurveys(params?: {
  page?: number;
  limit?: number;
  deviceId?: string;
  surveyor?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.surveys, params],
    queryFn: () => apiClient.getSurveys(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSurvey(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.survey, id],
    queryFn: () => apiClient.getSurvey(id),
    enabled: !!id,
  });
}

// SurveyMaster (Admin) hooks
export function useSurveyMasters(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: [QUERY_KEYS.surveyMasters, params],
    queryFn: () => apiClient.getSurveyMasters(params),
    staleTime: 60 * 1000,
  });
}

export function useSurveyMaster(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.surveyMaster, id],
    queryFn: () => apiClient.getSurveyMaster(id),
    enabled: !!id,
  });
}

export function useCreateSurveyMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => apiClient.createSurveyMaster(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.surveyMasters] });
    },
  });
}

export function useUpdateSurveyMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => apiClient.updateSurveyMaster(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.surveyMasters] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.surveyMaster, id] });
    },
  });
}

export function useDeleteSurveyMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteSurveyMaster(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.surveyMasters] });
    },
  });
}

// Device Assignments hooks
export function useDeviceAssignments(params?: { page?: number; limit?: number; deviceId?: string; surveyId?: string; status?: string; }) {
  return useQuery({
    queryKey: [QUERY_KEYS.deviceAssignments, params],
    queryFn: () => apiClient.getDeviceAssignments(params),
    staleTime: 60 * 1000,
  });
}

export function useDeviceAssignment(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.deviceAssignment, id],
    queryFn: () => apiClient.getDeviceAssignment(id),
    enabled: !!id,
  });
}

export function useCreateDeviceAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { deviceId: string; surveyId: string; fromDate: string; toDate: string; assignedBy?: string; notes?: string; }) =>
      apiClient.createDeviceAssignment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.deviceAssignments] });
    },
  });
}

export function useUpdateDeviceAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { deviceId?: string | number; surveyId?: string | number; fromDate?: string; toDate?: string; assignedBy?: string | number; unassignedDate?: string; status?: string; notes?: string; } }) =>
      apiClient.updateDeviceAssignment(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.deviceAssignments] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.deviceAssignment, id] });
    },
  });
}

export function useDeleteDeviceAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteDeviceAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.deviceAssignments] });
    },
  });
}

export function useAssignmentsBySurvey(surveyId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.assignmentsBySurvey, surveyId],
    queryFn: () => apiClient.getAssignmentsBySurvey(surveyId),
    enabled: !!surveyId,
  });
}

export function useAssignmentConflicts(params: { deviceId: string; startDate: string; endDate: string; }) {
  return useQuery({
    queryKey: [QUERY_KEYS.assignmentConflicts, params],
    queryFn: () => apiClient.getAssignmentConflicts(params),
    enabled: Boolean(params.deviceId && params.startDate && params.endDate),
    staleTime: 10 * 1000,
  });
}


// Valve Operations hooks
export function useValveOperations(params?: {
  page?: number;
  limit?: number;
  valveId?: string;
  operation?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.valveOperations, params],
    queryFn: async () => {
      const response = await apiClient.getValveOperations(params);
      const items = Array.isArray(response?.data) ? response.data : [];
      return { ...response, data: items };
    },
  });
}

export function useValveOperation(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.valveOperation, id],
    queryFn: () => apiClient.getValveOperation(id),
    enabled: !!id,
  });
}

export function useCreateValveOperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (operation: Omit<ValveOperation, "id" | "timestamp" | "status">) =>
      apiClient.createValveOperation(operation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.valveOperations] });
    },
  });
}

export function useUpdateValveOperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, operation }: { id: string; operation: Partial<ValveOperation> }) =>
      apiClient.updateValveOperation(id, operation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.valveOperations] });
    },
  });
}

export function useDeleteValveOperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteValveOperation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.valveOperations] });
    },
  });
}

// Configuration hooks
export function useConfig() {
  return useQuery({
    queryKey: [QUERY_KEYS.config],
    queryFn: () => apiClient.getConfig(),
    staleTime: 30 * 60 * 1000, // 30 minutes - config data changes rarely
  });
}

export function useCatastropheTypes() {
  return useQuery({
    queryKey: [QUERY_KEYS.catastropheTypes],
    queryFn: () => apiClient.getCatastropheTypes(),
    staleTime: 30 * 60 * 1000,
  });
}

export function useDeviceTypes() {
  return useQuery({
    queryKey: [QUERY_KEYS.deviceTypes],
    queryFn: () => apiClient.getDeviceTypes(),
    staleTime: 30 * 60 * 1000,
  });
}

export function useValveTypes() {
  return useQuery({
    queryKey: [QUERY_KEYS.valveTypes],
    queryFn: () => apiClient.getValveTypes(),
    staleTime: 30 * 60 * 1000,
  });
}

export function usePipelineMaterials() {
  return useQuery({
    queryKey: [QUERY_KEYS.pipelineMaterials],
    queryFn: () => apiClient.getPipelineMaterials(),
    staleTime: 30 * 60 * 1000,
  });
}

export function useStatusOptions(
  type: "device" | "pipeline" | "valve" | "catastrophe",
) {
  return useQuery({
    queryKey: [QUERY_KEYS.statusOptions, type],
    queryFn: () => apiClient.getStatusOptions(type),
    staleTime: 30 * 60 * 1000,
  });
}

export function useSurveyCategories(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: [QUERY_KEYS.surveyCategories, params],
    queryFn: () => apiClient.getSurveyCategories(params),
    staleTime: 5 * 60 * 1000,
  });
}

// Pipeline segments from AssetProperties ByType endpoint (external)
export function usePipelineSegmentsByType(type: string = "pipeline") {
  return useQuery({
    queryKey: ["assetPropertiesByType", type],
    queryFn: () => apiClient.getAssetPropertiesByType(type),
    staleTime: 5 * 60 * 1000,
  });
}
