import { useRef, useState } from "react";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T = any>(
  url: string,
  body?: unknown,
  method = "POST",
): Promise<T> {
  const response = await fetch(url, {
    method: body === undefined && method === "POST" ? "GET" : method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });
  const data = await response.json().catch(() => {
    throw new ApiError(
      response.status,
      "The server returned an unreadable response. Retry; your saved work is retained.",
    );
  });
  if (!response.ok || !data || data.error || data.success === false)
    throw new ApiError(
      response.status,
      localizeError(data?.error || `Request failed (${response.status}).`),
    );
  return data;
}
export function useDraft<T>(
  key: string,
  initial: T,
): [
  T,
  (value: T | ((previous: T) => T)) => void,
  { persisted: boolean; error: string },
] {
  const [snapshot, setSnapshot] = useState(() => {
    try {
      return {
        value: JSON.parse(localStorage.getItem(key) || "null") ?? initial,
        persisted: true,
        error: "",
      };
    } catch {
      return {
        value: initial,
        persisted: false,
        error:
          "Browser storage is unavailable or the saved draft could not be read.",
      };
    }
  });
  const valueRef = useRef<T>(snapshot.value);
  const update = (next: T | ((previous: T) => T)) => {
    const resolved =
      typeof next === "function"
        ? (next as (p: T) => T)(valueRef.current)
        : next;
    valueRef.current = resolved;
    try {
      localStorage.setItem(key, JSON.stringify(resolved));
      setSnapshot({ value: resolved, persisted: true, error: "" });
    } catch {
      setSnapshot({
        value: resolved,
        persisted: false,
        error:
          "Draft not saved locally. Keep this page open and save to the server or download a copy.",
      });
    }
  };
  return [
    snapshot.value,
    update,
    { persisted: snapshot.persisted, error: snapshot.error },
  ];
}
export function downloadFile(
  name: string,
  text: string,
  mime = "text/plain;charset=utf-8",
) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function clearAccountDrafts(userId: string) {
  for (const key of Object.keys(localStorage))
    if (
      key.startsWith(`kwentohabi-draft:${userId}:`) ||
      key.startsWith(`kwentohabi-material:${userId}:`)
    )
      localStorage.removeItem(key);
}

function localizeError(message: string): string {
  if (document.documentElement.lang !== "fil") return message;
  const translations: Record<string, string> = {
    "Sign in to your school account.":
      "Mag-sign in sa account ng iyong paaralan.",
    "Incorrect username or password.": "Hindi tama ang username o password.",
    "A teacher account is required.": "Kailangan ang account ng guro.",
    "Story not found in your assigned class/group.":
      "Wala ang kuwento sa iyong nakatalagang klase o pangkat.",
    "Another participant saved changes. Refresh and review before retrying. Your draft is retained.":
      "May bagong save ang ibang kasapi. I-refresh at repasuhin bago subukang muli. Nananatili ang iyong draft.",
    "Only the original author can revise this chapter.":
      "Ang orihinal na may-akda lamang ang maaaring magbago ng kabanata.",
    "This chapter changed after you started editing. Copy your retained draft, refresh, and compare before saving.":
      "Nabago ang kabanata habang nag-e-edit ka. Kopyahin ang iniingatang draft, i-refresh, at ihambing bago mag-save.",
    "Check the current draft before resolving evidence.":
      "Suriin muna ang kasalukuyang draft bago magpasya sa ebidensya.",
    "Recheck the current draft and policy first.":
      "Suriin muli ang kasalukuyang draft at antas ng nilalaman.",
    "Both authors must save a perspective note of at least 10 characters.":
      "Kailangang mag-save ang bawat may-akda ng tala na may 10 o higit na karakter.",
    "Choose a teacher username distinct from the sample students.":
      "Pumili ng username ng guro na naiiba sa mga sample na mag-aaral.",
    "Criterion weights must total 100.":
      "Dapat 100 ang kabuuang timbang ng pamantayan.",
    "Criterion weights must be greater than 0 and at most 100.":
      "Dapat higit sa 0 at hanggang 100 ang timbang ng bawat pamantayan.",
    "Confirm that you have permission to use this material.":
      "Tiyaking may pahintulot ka sa paggamit ng materyal.",
    "The teacher must assign a rubric.":
      "Kailangang magtakda muna ng pamantayan ang guro.",
    "Add a chapter before checking.":
      "Magdagdag muna ng kabanata bago magsuri.",
    "Add a chapter first.": "Magdagdag muna ng kabanata.",
    "An analysis request is already running for this account.":
      "May kasalukuyang pagsusuri para sa account na ito.",
    "The story or discussion changed while checking. Run a new check; the older result was discarded.":
      "Nabago ang kuwento o talakayan habang sinusuri. Patakbuhin muli; hindi ginamit ang lumang resulta.",
    "The draft or rubric changed during evaluation. Retry.":
      "Nabago ang draft o pamantayan habang sinusuri. Subukan muli.",
    "The current password is incorrect.":
      "Hindi tama ang kasalukuyang password.",
    "Username already exists.": "May gumagamit na ng username na ito.",
    "Select student members.": "Pumili ng mga kasaping mag-aaral.",
    "Individual stories have exactly one student.":
      "Iisang mag-aaral lamang ang kasapi sa indibidwal na kuwento.",
    "Choose an assigned class and writing mode.":
      "Pumili ng nakatalagang klase at uri ng gawain.",
    "The server could not complete this action. Retry; your last saved work is retained.":
      "Hindi nakumpleto ng server ang gawain. Subukan muli; nananatili ang huling na-save.",
  };
  if (translations[message]) return translations[message];
  if (message.startsWith("Monthly analysis allowance exhausted"))
    return "Naubos na ang limitasyon ng pagsusuri ngayong buwan. Makipag-ugnayan sa iyong guro.";
  if (message.includes("must contain"))
    return "Kumpletuhin ang patlang at sundin ang itinakdang haba. " + message;
  return message;
}
