import { fork } from "node:child_process";
import { fileURLToPath } from "node:url";
import { fail, string } from "./store";

function validateDocx(buffer: Buffer) {
  const end = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0 || end + 22 > buffer.length)
    fail(422, "This is not a readable DOCX archive.");
  const entries = buffer.readUInt16LE(end + 10),
    start = buffer.readUInt32LE(end + 16);
  if (entries > 500 || start >= buffer.length)
    fail(413, "DOCX archive has too many entries.");
  let cursor = start,
    expanded = 0,
    hasDocument = false;
  for (let i = 0; i < entries; i++) {
    if (
      cursor + 46 > buffer.length ||
      buffer.readUInt32LE(cursor) !== 0x02014b50
    )
      fail(422, "Invalid DOCX archive directory.");
    if (buffer.readUInt16LE(cursor + 8) & 1)
      fail(422, "Unlock encrypted documents before importing.");
    expanded += buffer.readUInt32LE(cursor + 24);
    if (expanded > 10_000_000)
      fail(413, "Expanded DOCX contents exceed the 10 MB import limit.");
    const nameLength = buffer.readUInt16LE(cursor + 28),
      extra = buffer.readUInt16LE(cursor + 30),
      comment = buffer.readUInt16LE(cursor + 32);
    const name = buffer.toString("utf8", cursor + 46, cursor + 46 + nameLength);
    if (name === "word/document.xml") hasDocument = true;
    cursor += 46 + nameLength + extra + comment;
  }
  if (!hasDocument) fail(422, "The ZIP file is not a Word DOCX document.");
}

export async function extractDocument(input: any): Promise<{
  text: string;
  truncated: boolean;
  pages?: number;
  fileName: string;
}> {
  const fileName = string(input.fileName, "File name", 200),
    extension = fileName.split(".").pop()?.toLowerCase();
  if (!["pdf", "docx", "txt"].includes(extension || ""))
    fail(
      415,
      "Import PDF, DOCX, or UTF-8 TXT. Convert older DOC files to DOCX first.",
    );
  const encoded = string(input.base64, "Document", 5_600_000);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded))
    fail(400, "Invalid document encoding.");
  const buffer = Buffer.from(encoded, "base64");
  if (buffer.length > 4_000_000) fail(413, "Document limit is 4 MB.");
  if (
    extension === "pdf" &&
    !buffer.subarray(0, 1024).includes(Buffer.from("%PDF-"))
  )
    fail(422, "This is not a PDF document.");
  if (extension === "docx") validateDocx(buffer);
  return new Promise((resolve, reject) => {
    const worker = fork(
      fileURLToPath(new URL("./document-worker.mjs", import.meta.url)),
      {
        windowsHide: true,
        serialization: "advanced",
        execArgv: ["--max-old-space-size=128"],
        stdio: ["ignore", "ignore", "ignore", "ipc"],
        env: {
          PATH: process.env.PATH,
          SystemRoot: process.env.SystemRoot,
          TEMP: process.env.TEMP,
        },
      },
    );
    worker.send({ buffer, extension });
    const timer = setTimeout(() => {
      worker.kill();
      reject(
        new Error(
          "Document import timed out. Split the file into a smaller selection.",
        ),
      );
    }, 20000);
    const finish = () => {
      clearTimeout(timer);
      worker.kill();
    };
    worker.once("message", (result: any) => {
      finish();
      if (result.error) reject(new Error(result.error));
      else resolve({ ...result, fileName });
    });
    worker.once("error", (error) => {
      finish();
      reject(error);
    });
    worker.once("exit", (code) => {
      clearTimeout(timer);
      if (code !== 0)
        reject(
          new Error(
            "Document import could not finish within its processing limit.",
          ),
        );
    });
  });
}
