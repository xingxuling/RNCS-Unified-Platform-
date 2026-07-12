// 反应式 hook：当前主体 + 回验
import { useEffect, useState, useCallback } from "react";
import {
  getActiveSubject,
  loadSubjects,
  loadFeedback,
  setActiveSubjectId,
  saveSubject,
  deleteSubject as deleteSubjectStore,
  saveFeedback as saveFeedbackStore,
  deleteFeedback as deleteFeedbackStore,
  emitDataChange,
  onDataChange,
  clearAll as clearAllStore,
} from "./store";
import type { SubjectModel, FeedbackRecord } from "./types";

export function useAetherData() {
  const [subjects, setSubjects] = useState<SubjectModel[]>([]);
  const [active, setActive] = useState<SubjectModel | null>(null);
  const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    const list = loadSubjects();
    const cur = getActiveSubject();
    setSubjects(list);
    setActive(cur);
    setFeedback(loadFeedback(cur.id));
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
    const off = onDataChange(refresh);
    return off;
  }, [refresh]);

  const switchSubject = (id: string) => { setActiveSubjectId(id); emitDataChange(); };
  const upsertSubject = (s: SubjectModel) => { saveSubject(s); emitDataChange(); };
  const removeSubject = (id: string) => { deleteSubjectStore(id); emitDataChange(); };
  const upsertFeedback = (f: FeedbackRecord) => { saveFeedbackStore(f); emitDataChange(); };
  const removeFeedback = (date: string) => {
    if (active) { deleteFeedbackStore(active.id, date); emitDataChange(); }
  };
  const resetAll = () => { clearAllStore(); emitDataChange(); };

  return {
    ready, subjects, active, feedback,
    switchSubject, upsertSubject, removeSubject,
    upsertFeedback, removeFeedback, resetAll,
  };
}
