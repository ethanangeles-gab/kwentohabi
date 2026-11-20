import type { Chapter } from "../types";
export interface WritingDraft {
  title: string;
  text: string;
  chapterId: string;
  baseText: string;
}
export interface WritingBuffers {
  activeKey: string;
  buffers: Record<string, WritingDraft>;
}
export const blankDraft = (): WritingDraft => ({
  title: "",
  text: "",
  chapterId: "",
  baseText: "",
});
export function editChapter(
  state: WritingBuffers,
  chapter: Chapter,
): WritingBuffers {
  const key = `chapter:${chapter.id}`;
  return {
    activeKey: key,
    buffers: {
      ...state.buffers,
      [key]: state.buffers[key] || {
        title: chapter.title,
        text: chapter.text,
        chapterId: chapter.id,
        baseText: chapter.text,
      },
    },
  };
}
export function newChapter(state: WritingBuffers): WritingBuffers {
  return {
    activeKey: "new",
    buffers: { ...state.buffers, new: state.buffers.new || blankDraft() },
  };
}
/** A save only acknowledges its own snapshot. Later keystrokes and other buffers survive. */
export function finishChapterSave(
  state: WritingBuffers,
  key: string,
  submitted: WritingDraft,
  saved: Chapter,
): WritingBuffers {
  const current = state.buffers[key];
  if (!current) return state;
  const buffers = { ...state.buffers };
  const changed =
    current.text !== submitted.text || current.title !== submitted.title;
  const destination = key === "new" ? `chapter:${saved.id}` : key;
  if (changed) {
    buffers[destination] = {
      ...current,
      chapterId: saved.id,
      baseText: saved.text,
    };
    if (destination !== key) delete buffers[key];
  } else delete buffers[key];
  buffers.new ??= blankDraft();
  return {
    buffers,
    activeKey:
      state.activeKey === key
        ? changed
          ? destination
          : "new"
        : state.activeKey,
  };
}
