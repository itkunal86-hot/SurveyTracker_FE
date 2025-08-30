import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Download } from "lucide-react";
import { ValveOperationForm } from "./ValveOperationForm";
import { ValveOperationList } from "./ValveOperationList";
import { ValveOperationStats } from "./valve-operations/ValveOperationStats";
import { useValveOperations } from "@/hooks/useValveOperations";

const ValveOperationLog = () => {
  const {
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
  } = useValveOperations();

  const [showForm, setShowForm] = useState(false);

  const handleAddNew = () => {
    setShowForm(true);
  };

  const handleSave = (operationData: Parameters<typeof addOperation>[0]) => {
    addOperation(operationData);
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Valve Operation Log</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')} className="gap-2 hover-scale">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={handleAddNew} className="gap-2 hover-scale">
            <Plus className="h-4 w-4" />
            Add Operation
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <ValveOperationStats 
        operations={operations}
        valves={valves}
        getValveCurrentStatus={getValveCurrentStatus}
      />

      {/* Form or List */}
      {showForm ? (
        <ValveOperationForm
          valves={valves}
          catastrophes={catastrophes}
          getValveCurrentStatus={getValveCurrentStatus}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <ValveOperationList
          operations={getFilteredOperations()}
          valves={valves}
          catastrophes={catastrophes}
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={clearFilters}
        />
      )}
    </div>
  );
};

export default ValveOperationLog;