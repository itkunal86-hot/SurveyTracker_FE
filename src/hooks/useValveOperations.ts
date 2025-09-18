import { useState, useMemo } from "react";
import { useValves, useCatastrophes, useValveOperations as useValveOperationsAPI, useCreateValveOperation } from "./useApiQueries";
import { useToast } from "@/hooks/use-toast";
import {
  ValveOperation,
  Valve,
  Catastrophe,
  ValveOperationFilters,
} from "@/types/valve";

export const useValveOperations = () => {
  const { toast } = useToast();
  
  // API hooks
  const { data: valvesResponse, isLoading: loadingValves } = useValves({
    limit: 100,
  });
  const { data: catastrophesResponse, isLoading: loadingCatastrophes } =
    useCatastrophes({ limit: 100 });
  
  const { data: operationsResponse, isLoading: loadingOperations } = useValveOperationsAPI({
    limit: 100,
  });
  
  const createOperationMutation = useCreateValveOperation();

  // Transform API data to component format
  const operations: ValveOperation[] = useMemo(() => {
    if (!Array.isArray(operationsResponse?.data)) return [];

    return operationsResponse.data.map((op) => ({
      id: op.id,
      catastropheId: "CATASTROPHE_001",
      valveId: op.valveId,
      actionType: op.operation === "OPEN" ? "open" : "close",
      actionTimestamp: new Date(op.timestamp),
      performedBy: op.operator || "Unknown",
      remarks: op.notes || "",
    }));
  }, [operationsResponse]);

  const valves: Valve[] = useMemo(() => {
    if (!Array.isArray(valvesResponse?.data)) return [];

    return valvesResponse.data.map((valve) => ({
      id: valve.id,
      name: valve.name,
      segmentId: valve.pipelineId || "Unknown",
      currentStatus:
        valve.status === "OPEN"
          ? "open"
          : valve.status === "CLOSED"
            ? "closed"
            : valve.status === "PARTIALLY_OPEN"
              ? "open"
              : "closed",
    }));
  }, [valvesResponse]);

  const catastrophes: Catastrophe[] = useMemo(() => {
    if (!Array.isArray(catastrophesResponse?.data)) return [];

    return catastrophesResponse.data.map((cat) => ({
      id: cat.id,
      description: cat.description || "No description provided",
    }));
  }, [catastrophesResponse]);

  const [filters, setFilters] = useState<ValveOperationFilters>({
    catastropheId: "all",
    valveId: "all",
    actionType: "all",
  });

  // Get current valve status based on latest operation
  const getValveCurrentStatus = (valveId: string): "open" | "closed" => {
    const valveOperations = operations
      .filter((op) => op.valveId === valveId)
      .sort(
        (a, b) => b.actionTimestamp.getTime() - a.actionTimestamp.getTime(),
      );

    if (valveOperations.length > 0) {
      const lastAction = valveOperations[0].actionType;
      return lastAction === "close" ? "closed" : "open";
    }

    const valve = valves.find((v) => v.id === valveId);
    return valve?.currentStatus || "open";
  };

  const addOperation = async (operationData: Omit<ValveOperation, "id">) => {
    try {
      // Map frontend format to API format
      await createOperationMutation.mutateAsync({
        valveId: operationData.valveId,
        operation: operationData.actionType === "open" ? "OPEN" : "CLOSE",
        operator: operationData.performedBy,
        reason: `Related to catastrophe: ${operationData.catastropheId}`,
        notes: operationData.remarks,
      });
      
      toast({
        title: "Success",
        description: "Valve operation saved successfully",
      });
    } catch (error) {
      console.error("Error saving valve operation:", error);
      toast({
        title: "Error", 
        description: "Failed to save valve operation",
        variant: "destructive",
      });
    }
  };

  const getFilteredOperations = () => {
    return operations.filter((op) => {
      if (
        filters.catastropheId &&
        filters.catastropheId !== "all" &&
        op.catastropheId !== filters.catastropheId
      )
        return false;
      if (
        filters.valveId &&
        filters.valveId !== "all" &&
        op.valveId !== filters.valveId
      )
        return false;
      if (
        filters.actionType &&
        filters.actionType !== "all" &&
        op.actionType !== filters.actionType
      )
        return false;
      return true;
    });
  };

  const clearFilters = () => {
    setFilters({ catastropheId: "all", valveId: "all", actionType: "all" });
  };

  const handleExport = (format: "csv" | "pdf") => {
    const filteredOps = getFilteredOperations();

    if (format === "csv") {
      const csvHeaders =
        "Operation ID,Catastrophe ID,Valve ID,Action Type,Timestamp,Performed By,Remarks\n";
      const csvData = filteredOps
        .map(
          (op) =>
            `${op.id},${op.catastropheId},${op.valveId},${op.actionType},${op.actionTimestamp.toISOString()},${op.performedBy},"${op.remarks || ""}"`,
        )
        .join("\n");

      const blob = new Blob([csvHeaders + csvData], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `valve-operations-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return {
    operations,
    valves,
    catastrophes,
    filters,
    setFilters,
    getValveCurrentStatus,
    addOperation,
    getFilteredOperations,
    clearFilters,
    handleExport,
    isLoading: loadingValves || loadingCatastrophes || loadingOperations,
  };
};
