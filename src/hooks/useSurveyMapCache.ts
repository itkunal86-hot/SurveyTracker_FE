import { useEffect, useSyncExternalStore } from "react";
import {
  ensureSurveyMapCache,
  getSurveyMapSnapshot,
  subscribeSurveyMapCache,
} from "@/lib/surveyMapCache";

export function useSurveyMapCache() {
  const snapshot = useSyncExternalStore(
    subscribeSurveyMapCache,
    getSurveyMapSnapshot,
    getSurveyMapSnapshot,
  );

  useEffect(() => {
    void ensureSurveyMapCache();
  }, []);

  return snapshot;
}
