import OpenAI from "openai";
import { parse } from "@babel/parser";
import traverseImport from "@babel/traverse";
import * as generatorNS from "@babel/generator";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const traverse = traverseImport.default ?? traverseImport;

/**
 * ---- NEW: ignore macOS junk paths inside ZIPs ----
 * Works if caller passes req.body.filePath or req.body.filename.
 */
function isMacJunkPath(p) {
  if (!p) return false;
  const s = String(p).replaceAll("\\", "/");
  if (s.includes("/__MACOSX/") || s.startsWith("__MACOSX/")) return true;
  // any segment starts with ._
  if (s.split("/").some((seg) => seg.startsWith("._"))) return true;
  // direct file name starts with ._
  if (s.startsWith("._")) return true;
  return false;
}

/**
 * ---- NEW: detect binary / AppleDouble-like content ----
 * If the "code" contains control chars / NUL bytes etc - skip parsing.
 */
function looksBinaryText(str) {
  if (typeof str !== "string" || !str) return false;

  // NUL byte => definitely binary
  if (str.indexOf("\x00") !== -1) return true;

  // AppleDouble / weird control bytes often appear as control chars early
  const head = str.slice(0, 2048);

  // Control chars except: \t \n \r
  if (/[\x01-\x08\x0B\x0C\x0E-\x1F]/.test(head)) return true;

  // If it starts with lots of replacement chars, it's usually bad decoding
  const rep = (head.match(/\uFFFD/g) || []).length;
  if (rep >= 5) return true;

  // Heuristic: too many non-printable chars in head
  let bad = 0;
  for (let i = 0; i < head.length; i++) {
    const c = head.charCodeAt(i);
    const ok =
      c === 9 || // \t
      c === 10 || // \n
      c === 13 || // \r
      (c >= 32 && c <= 126) || // ascii printable
      c >= 160; // allow unicode
    if (!ok) bad++;
  }
  if (head.length > 0 && bad / head.length > 0.02) return true;

  return false;
}

/**
 * Try to unwrap @babel/generator to a callable function across ESM/CJS wrappers.
 * We DO NOT crash the whole translation if generator is unavailable.
 */
function unwrapGenerator(mod) {
  let g = mod;
  for (let i = 0; i < 10; i++) {
    if (typeof g === "function") return g;

    if (g && typeof g === "object") {
      if (typeof g.generate === "function") return g.generate;
      if ("default" in g) {
        g = g.default;
        continue;
      }
    }
    break;
  }
  return null;
}

// Resolve generator once at module load
let generate = unwrapGenerator(generatorNS);
if (typeof generate !== "function") {
  try {
    generate = unwrapGenerator(require("@babel/generator"));
  } catch {
    // ignore
  }
}

const GENERATOR_OK = typeof generate === "function";
if (!GENERATOR_OK) {
  console.warn("[translate-js] @babel/generator unresolved. JS files will be returned unchanged.");
}

/**
 * Translate ONLY human-readable strings in JS:
 * - string literals (excluding import/require paths)
 * - template literals with NO expressions
 * - JSX text + JSX attribute string values
 *
 * Request: { code, targetLang, filePath? | filename? }
 * Response: { code }
 */

function looksLikePathOrCode(s) {
  const t = s.trim();
  if (!t) return true;
  if (/^(https?:\/\/|mailto:|tel:|\/|\.{1,2}\/?|#)/i.test(t)) return true;
  if (/^[A-Z0-9_]{2,}$/.test(t) && t.length <= 12) return true;
  if (/[{}[\];=<>]/.test(t) && t.length < 80) return true;
  return false;
}

async function translateBatch(openai, strings, targetLang) {
  if (!strings.length) return [];
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const payload = { targetLang, strings };

  const resp = await openai.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You translate UI text inside JavaScript source code. Return ONLY valid JSON with key 'translations' as an array of strings matching input length/order. Do not add commentary."
      },
      {
        role: "user",
        content:
          "Translate only the human-visible text. Do NOT translate identifiers, URLs, file paths, CSS classes, or code fragments.\nInput JSON:\n" +
          JSON.stringify(payload)
      }
    ]
  });

  const raw = resp.choices?.[0]?.message?.content || "{}";
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return strings;
  }
  const arr = Array.isArray(data.translations) ? data.translations : null;
  if (!arr || arr.length !== strings.length) return strings;
  return arr.map((x, i) => (typeof x === "string" ? x : strings[i]));
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY not set in Vercel env vars." });
  }

  try {
    const { code, targetLang, filePath, filename } = req.body || {};
    if (typeof code !== "string" || !targetLang) {
      return res.status(400).json({ error: "Missing code or targetLang" });
    }

    // ---- NEW: skip macOS junk by path/name (if provided) ----
    const p = filePath || filename || "";
    if (isMacJunkPath(p)) {
      return res.status(200).json({ code }); // unchanged
    }

    // ---- NEW: skip binary/AppleDouble disguised as .js ----
    if (looksBinaryText(code)) {
      return res.status(200).json({ code }); // unchanged, no crash
    }

    // If generator is not callable, we must NOT attempt AST->code generation.
    if (!GENERATOR_OK) {
      return res.status(200).json({ code });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const ast = parse(code, {
      sourceType: "unambiguous",
      plugins: ["jsx", "typescript", "classProperties", "dynamicImport", "topLevelAwait"]
    });

    const items = [];
    const texts = [];
    const seen = new Map(); // text -> index in texts

    function addText(node, get, set, kind) {
      const v = get();
      if (typeof v !== "string") return;

      const trimmed = v.trim();
      if (!trimmed) return;
      if (looksLikePathOrCode(trimmed)) return;

      let idx = seen.get(trimmed);
      if (idx === undefined) {
        idx = texts.length;
        seen.set(trimmed, idx);
        texts.push(trimmed);
      }
      items.push({ node, get, set, idx, original: v, kind });
    }

    traverse(ast, {
      StringLiteral(path) {
        const node = path.node;
        const parent = path.parent;

        if (
          parent &&
          (parent.type === "ImportDeclaration" ||
            parent.type === "ExportNamedDeclaration" ||
            parent.type === "ExportAllDeclaration") &&
          parent.source === node
        ) {
          return;
        }

        if (parent && parent.type === "CallExpression" && parent.arguments && parent.arguments[0] === node) {
          const callee = parent.callee;
          const calleeName = (callee && callee.type === "Identifier" && callee.name) || null;
          if (calleeName === "require") return;
        }

        if (
          parent &&
          (parent.type === "ObjectProperty" || parent.type === "ObjectMethod") &&
          parent.key === node &&
          !parent.computed
        ) {
          return;
        }

        addText(
          node,
          () => node.value,
          (t) => {
            node.value = t;
          },
          "string"
        );
      },

      TemplateLiteral(path) {
        const node = path.node;
        if (node.expressions && node.expressions.length) return;
        const raw = node.quasis?.map((q) => q.value.cooked).join("") ?? "";
        addText(
          node,
          () => raw,
          (t) => {
            node.quasis = [{ type: "TemplateElement", tail: true, value: { raw: t, cooked: t } }];
            node.expressions = [];
          },
          "template"
        );
      },

      JSXText(path) {
        const node = path.node;
        addText(
          node,
          () => node.value,
          (t) => {
            node.value = t;
          },
          "jsxtext"
        );
      },

      JSXAttribute(path) {
        const node = path.node;
        const val = node.value;
        if (!val) return;
        if (val.type === "StringLiteral") {
          addText(
            val,
            () => val.value,
            (t) => {
              val.value = t;
            },
            "jsxattr"
          );
        }
      }
    });

    const translations = await translateBatch(openai, texts, targetLang);

    for (const it of items) {
      const origFull = it.original;
      const m = origFull.match(/^(\s*)([\s\S]*?)(\s*)$/);
      const lead = m?.[1] ?? "";
      const tail = m?.[3] ?? "";
      const t = translations[it.idx] ?? it.get();
      it.set(lead + t + tail);
    }

    const genResult = generate(ast, { retainLines: true, comments: true }, code);
    const out = genResult && typeof genResult.code === "string" ? genResult.code : code;

    return res.status(200).json({ code: out });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
