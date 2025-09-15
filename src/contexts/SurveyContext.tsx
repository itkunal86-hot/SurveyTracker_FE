import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from "@/lib/api";

export interface ActiveSurvey {
  id: string;
  name: string;
  categoryName: string;
  status: 'ACTIVE' | 'CLOSED';
  startDate: string;
  endDate: string;
}

interface SurveyContextType {
  activeSurveys: ActiveSurvey[];
  currentSurvey: ActiveSurvey | null;
  setCurrentSurvey: (survey: ActiveSurvey) => void;
  isLoading: boolean;
}

const SurveyContext = createContext<SurveyContextType | undefined>(undefined);

export const useSurveyContext = () => {
  const context = useContext(SurveyContext);
  if (context === undefined) {
    throw new Error('useSurveyContext must be used within a SurveyProvider');
  }
  return context;
};

interface SurveyProviderProps {
  children: ReactNode;
}

// Mock active surveys data
const mockActiveSurveys: ActiveSurvey[] = [
  {
    id: "SUR_001",
    name: "Mumbai Gas Main Line Survey",
    categoryName: "Gas Pipeline",
    status: "ACTIVE",
    startDate: "2024-01-15",
    endDate: "2024-03-15",
  },
  {
    id: "SUR_002",
    name: "Fiber Network Expansion",
    categoryName: "Fiber Optics",
    status: "ACTIVE",
    startDate: "2024-02-01",
    endDate: "2024-04-01",
  },
  {
    id: "SUR_004",
    name: "Metro Pipeline Extension",
    categoryName: "Gas Pipeline",
    status: "ACTIVE",
    startDate: "2024-01-20",
    endDate: "2024-04-20",
  },
  {
    id: "SUR_005",
    name: "Underground Electrical Survey",
    categoryName: "Electrical",
    status: "ACTIVE",
    startDate: "2024-02-15",
    endDate: "2024-05-15",
  },
];

export const SurveyProvider: React.FC<SurveyProviderProps> = ({ children }) => {
  const [activeSurveys, setActiveSurveys] = useState<ActiveSurvey[]>([]);
  const [currentSurvey, setCurrentSurveyState] = useState<ActiveSurvey | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Persist and expose setter
  const setCurrentSurvey = (survey: ActiveSurvey | null) => {
    setCurrentSurveyState(survey);
    try {
      if (survey) {
        localStorage.setItem("activeSurveyId", survey.id);
        localStorage.setItem("activeSurvey", JSON.stringify(survey));
      } else {
        localStorage.removeItem("activeSurveyId");
        localStorage.removeItem("activeSurvey");
      }
    } catch {}
  };

  useEffect(() => {
    const loadActiveSurveys = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.getSurveyMasters({ status: "ACTIVE" });
        const items = Array.isArray(res.data) ? res.data : [];
        const mapped = items
          .filter(s => s.status === "ACTIVE")
          .map((s) => ({
            id: s.id,
            name: s.name,
            categoryName: s.categoryName || "",
            status: s.status,
            startDate: s.startDate,
            endDate: s.endDate,
          }));
        setActiveSurveys(mapped);
        // Try to restore persisted selection
        let next: ActiveSurvey | null = null;
        try {
          const storedId = localStorage.getItem("activeSurveyId");
          if (storedId) {
            next = mapped.find(s => s.id === storedId) || null;
          }
        } catch {}
        if (!next && mapped.length > 0) next = mapped[0];
        setCurrentSurvey(next);
      } catch (error) {
        console.error('Failed to load active surveys:', error);
        setActiveSurveys([]);
        setCurrentSurvey(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadActiveSurveys();
  }, []);

  const value: SurveyContextType = {
    activeSurveys,
    currentSurvey,
    setCurrentSurvey,
    isLoading,
  };

  return (
    <SurveyContext.Provider value={value}>
      {children}
    </SurveyContext.Provider>
  );
};
