import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
        const controller = new AbortController();
        const url = `https://localhost:7215/api/SurveyMaster?status=ACTIVE`;
        const resp = await fetch(url, { method: "GET", signal: controller.signal });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();

        const candidates: any[] = Array.isArray(json?.data?.data)
          ? json.data.data
          : Array.isArray(json?.data?.items)
            ? json.data.items
            : Array.isArray(json?.data)
              ? json.data
              : Array.isArray(json)
                ? json
                : [];

        const toDateOnly = (val: any): string => {
          if (!val) return new Date().toISOString().slice(0, 10);
          const s = String(val);
          const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
          if (m) return m[1];
          if (s.includes("T")) return s.split("T")[0];
          const d = new Date(s);
          if (!isNaN(d.getTime())) {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            return `${yyyy}-${mm}-${dd}`;
          }
          return s.slice(0, 10);
        };

        const mapped: ActiveSurvey[] = candidates.map((raw: any) => {
          const id = String(raw.id ?? raw.ID ?? raw.surveyId ?? raw.SurveyId ?? raw.smId ?? raw.SM_ID ?? `SUR_${Date.now()}`);
          const name = String(raw.name ?? raw.surveyName ?? raw.SurveyName ?? raw.smName ?? raw.SM_NAME ?? "");
          const categoryName = String(raw.categoryName ?? raw.CategoryName ?? raw.scName ?? raw.ScName ?? "");
          const statusRaw = (raw.status ?? raw.Status ?? raw.smStatus ?? raw.SM_STATUS ?? "ACTIVE").toString();
          const status = statusRaw.toUpperCase() === "CLOSED" ? "CLOSED" : "ACTIVE";
          const start = raw.startDate ?? raw.StartDate ?? raw.fromDate ?? raw.FromDate ?? raw.smStartDate ?? raw.SM_START_DATE;
          const end = raw.endDate ?? raw.EndDate ?? raw.toDate ?? raw.ToDate ?? raw.smEndDate ?? raw.SM_END_DATE;
          return {
            id,
            name,
            categoryName,
            status,
            startDate: toDateOnly(start),
            endDate: toDateOnly(end),
          };
        }).filter((s: ActiveSurvey) => s.status === "ACTIVE");

        setActiveSurveys(mapped);

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
