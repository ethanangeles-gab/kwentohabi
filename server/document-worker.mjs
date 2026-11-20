process.once("message", async (workerData) => {
  const buffer = Buffer.from(workerData.buffer);
  try {
    let text = "",
      pages;
    if (workerData.extension === "pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({
        data: new Uint8Array(buffer),
        isEvalSupported: false,
        useSystemFonts: false,
      });
      try {
        const info = await parser.getInfo();
        if (info.total > 50)
          throw new Error(
            "Use a PDF with at most 50 pages. Split longer materials before importing.",
          );
        const result = await parser.getText();
        text = result.pages.map((page) => page.text).join("\n\n");
        pages = info.total;
      } finally {
        await parser.destroy();
      }
    } else if (workerData.extension === "docx") {
      const mammoth = await import("mammoth");
      const result = await mammoth.default.extractRawText({ buffer });
      text = result.value;
    } else text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    text = text.replaceAll("\u0000", "").trim();
    if (!text)
      throw new Error(
        "No readable text was found. Scanned PDFs require OCR; encrypted documents must be unlocked first.",
      );
    process.send({
      text: text.slice(0, 50000),
      truncated: text.length > 50000,
      pages,
    });
  } catch (error) {
    process.send({
      error: error.message || "This document could not be read.",
    });
  }
});
