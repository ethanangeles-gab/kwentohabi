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
  const responseBody = await response.text();
  let data: any;
  try {
    data = JSON.parse(responseBody);
  } catch {
    const contentType =
      response.headers.get("content-type")?.split(";")[0] || "unknown content type";
    throw new ApiError(
      response.status,
      `The server returned a non-JSON response (HTTP ${response.status}, ${contentType}). Check the deployment API routing and function logs; your saved work is retained.`,
    );
  }
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
    "Choose Teacher or Student before signing in.":
      "Piliin ang Guro o Mag-aaral bago mag-sign in.",
    "Your account does not match the selected role. Choose the correct role and try again.":
      "Hindi tugma ang account sa napiling tungkulin. Piliin ang tamang tungkulin at subukang muli.",
    "Passwords do not match.": "Hindi magkatugma ang mga password.",
    "Choose Teacher or Student before creating an account.":
      "Piliin ang Guro o Mag-aaral bago gumawa ng account.",
    "Read and acknowledge the privacy notice before creating an account.":
      "Basahin at kilalanin muna ang abiso sa privacy bago gumawa ng account.",
    "Join code is invalid, expired, revoked, or fully used. Ask your school for a new code.":
      "Hindi wasto, nag-expire, binawi, o naubos na ang join code. Humingi ng bagong code sa paaralan.",
    "The join code is for a different account type. Choose the correct role.":
      "Para sa ibang uri ng account ang join code. Piliin ang tamang tungkulin.",
    "Your school must complete setup before you can join.":
      "Kailangang kumpletuhin muna ng paaralan ang setup bago ka makasali.",
    "Use 3-80 letters, digits, dots, underscores, or hyphens.":
      "Gumamit ng 3–80 titik, numero, tuldok, underscore o gitling.",
    "Enter a valid email address or a username with 3-80 letters, digits, dots, underscores, or hyphens.":
      "Maglagay ng wastong email address o username na may 3–80 titik, numero, tuldok, underscore o gitling.",
    "Use the account form fields only. Your class and role come from the join code.":
      "Gamitin lamang ang mga patlang ng form. Mula sa join code ang klase at tungkulin.",
    "Full name cannot contain control characters.":
      "Hindi maaaring maglaman ng control character ang buong pangalan.",
    "Too many account creation attempts. Try again in 15 minutes.":
      "Masyadong maraming pagtatangkang gumawa ng account. Subukan muli pagkalipas ng 15 minuto.",
    "Account creation is busy. Please try again later.":
      "Abala ang paggawa ng account. Subukan muli mamaya.",
    "Choose a student or teacher invitation.":
      "Pumili ng imbitasyon para sa mag-aaral o guro.",
    "Student codes allow 1-100 accounts. Teacher codes are single-use.":
      "Para sa 1–100 account ang student code. Isang beses lamang magagamit ang teacher code.",
    "Revoke an unused join code before creating another.":
      "Bawiin muna ang hindi nagamit na code bago gumawa ng bago.",
    "Join code not found in your classes.":
      "Wala ang join code sa iyong mga klase.",
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
