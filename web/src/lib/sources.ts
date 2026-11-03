import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { aiService } from "./ai";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export type SourceKind = "pdf" | "json" | "text" | "image";

export interface Source {
  name: string;
  kind: SourceKind;
  text: string;
}

export const SOURCE_ACCEPT = ".pdf,.json,.md,.markdown,.txt,image/*";

const LIMITS: Record<SourceKind, number> = {
  pdf: 10 * 1024 * 1024,
  image: 5 * 1024 * 1024,
  json: 2 * 1024 * 1024,
  text: 2 * 1024 * 1024
};

export function getSourceKind(file: File): SourceKind {
  if (file.type.includes("pdf") || /\.pdf$/i.test(file.name)) return "pdf";
  if (file.type.includes("json") || /\.json$/i.test(file.name)) return "json";
  if (file.type.startsWith("image/")) return "image";
  return "text";
}

export async function getSource(file: File): Promise<Source> {
  const kind = getSourceKind(file);
  const limit = LIMITS[kind];

  if (file.size > limit) {
    throw new Error(
      `${file.name} is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit for ${kind} is ${limit / 1024 / 1024}MB.`
    );
  }

  return { name: file.name, kind, text: await getText(file, kind) };
}

async function getText(file: File, kind: SourceKind): Promise<string> {
  if (kind === "pdf") return getPdfText(file);
  if (kind === "image") return aiService.postImageReading(await getDataUrl(file));

  const text = await file.text();

  if (kind === "json") {
    JSON.parse(text);
  }

  return text;
}

async function getPdfText(file: File): Promise<string> {
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];

  for (let number = 1; number <= pdf.numPages; number++) {
    const page = await pdf.getPage(number);
    const content = await page.getTextContent();
    pages.push(content.items.map((item: any) => item.str).join(" "));
  }

  const text = pages.join("\n").trim();

  if (!text) {
    throw new Error(`${file.name} holds no selectable text. Screenshot the pages instead.`);
  }

  return text;
}

export async function getDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`${file.name} could not be read.`));
    reader.readAsDataURL(file);
  });
}
