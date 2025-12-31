import OpenAI from "openai";
import { parse } from "node-html-parser";

/**
 * Translate ONLY visible text content in HTML (plus a few safe attributes),
 * preserving tags/structure.
 *
 * Request: { html, targetLang, rtl, rules, filePath? | filename? }
 * Response: { html }
 */

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE"]);
const ATTRS = ["placeholder", "title", "aria-label", "alt", "value"];

/**
 * ---- NEW: ignore macOS junk paths inside ZIPs ----
 * Works if caller passes req.body.filePath or req.body.filename.
 */
function isMacJunkPath(p) {
  if (!p) return false;
  const s = String(p).replaceAll("\\", "/");
  if (s.includes("/__MACOSX/") || s.startsWith("__MACOSX/")) return true;
  if (s.split("/").some((seg) => seg.startsWith("._"))) return true;
  if (s.startsWith("._")) return true;
  return false;
}

/**
 * ---- NEW: detect binary / AppleDouble-like content ----
 * If the "html" contains control chars / NUL bytes etc - skip parsing.
 */
function looksBinaryText(str) {
  if (typeof str !== "string" || !str) return false;

  if (str.indexOf("\x00") !== -1) return true;

  const head = str.slice(0, 2048);

  if (/[\x01-\x08\x0B\x0C\x0E-\x1F]/.test(head)) return true;

  const rep = (head.match(/\uFFFD/g) || []).length;
  if (rep >= 5) return true;

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

function normalizeWhitespace(s) {
  if (!s || !String(s).trim()) return s;
  return String(s).replace(/\s+/g, " ").trim();
}

function shouldSkipNode(node) {
  let p = node.parentNode;
  while (p) {
    if (p.tagName && SKIP_TAGS.has(String(p.tagName).toUpperCase())) return true;
    p = p.parentNode;
  }
  return false;
}

function looksLikeCodeOrPath(s) {
  const t = s.trim();
  if (!t) return true;
  if (/^(https?:\/\/|mailto:|tel:|\/|\.{1,2}\/|#)/i.test(t)) return true;
  if (/[{}[\];=<>]/.test(t) && t.length < 80) return true;
  return false;
}

function applySimpleRules(text, rules) {
  let out = text;

  if (rules?.brand?.enabled && rules.brand.from && rules.brand.to) {
    out = out.replace(new RegExp(escapeRegExp(rules.brand.from), "gi"), rules.brand.to);
  }
  if (rules?.country?.enabled && rules.country.from && rules.country.to) {
    out = out.replace(new RegExp(escapeRegExp(rules.country.from), "gi"), rules.country.to);
  }
  if (rules?.currency?.enabled && rules.currency.from && rules.currency.to) {
    out = out.replace(new RegExp(escapeRegExp(rules.currency.from), "g"), rules.currency.to);
  }

  return out;
}

function escapeRegExp(string) {
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function translateBatch(openai, strings, targetLang) {
  if (!strings.length) return [];

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const prompt = { targetLang, strings };

  const resp = await openai.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You translate UI text. Return ONLY valid JSON with key 'translations' as an array of strings of the same length/order as input. Do NOT add commentary."
      },
      {
        role: "user",
        content:
          "Translate the following strings to " +
          targetLang +
          ". Keep punctuation, whitespace meaning, and do not translate code, URLs, or placeholders. Input JSON:\n" +
          JSON.stringify(prompt)
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
    const { html, targetLang, rtl, rules, filePath, filename } = req.body || {};
    if (typeof html !== "string" || !targetLang) return res.status(400).json({ error: "Missing html or targetLang" });

    // ---- NEW: skip macOS junk by path/name (if provided) ----
    const p = filePath || filename || "";
    if (isMacJunkPath(p)) {
      return res.status(200).json({ html }); // unchanged
    }

    // ---- NEW: skip binary/AppleDouble disguised as text ----
    if (looksBinaryText(html)) {
      return res.status(200).json({ html }); // unchanged, no crash
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const root = parse(String(html), { comment: true, script: true, style: true });

    const nodesToTranslate = [];
    const originals = [];

    const walk = (node) => {
      if (!node) return;

      if (node.nodeType === 3) {
        if (!shouldSkipNode(node)) {
          const orig = String(node.rawText ?? node.text ?? "");
          const norm = normalizeWhitespace(orig);
          if (norm && !looksLikeCodeOrPath(norm)) {
            nodesToTranslate.push({ kind: "text", node, orig });
            originals.push(norm);
          }
        }
      }

      if (node.tagName && !SKIP_TAGS.has(String(node.tagName).toUpperCase())) {
        for (const a of ATTRS) {
          const v = node.getAttribute?.(a);
          const norm = normalizeWhitespace(v);
          if (norm && !looksLikeCodeOrPath(norm)) {
            nodesToTranslate.push({ kind: "attr", node, attr: a, orig: v });
            originals.push(norm);
          }
        }
      }

      if (node.childNodes?.length) node.childNodes.forEach(walk);
    };

    walk(root);

    const pre = originals.map((t) => applySimpleRules(t, rules));
    const translated = await translateBatch(openai, pre, targetLang);

    let k = 0;
    for (const item of nodesToTranslate) {
      const origFull = String(item.orig ?? "");
      const m = origFull.match(/^(\s*)([\s\S]*?)(\s*)$/);
      const lead = m?.[1] ?? "";
      const tail = m?.[3] ?? "";
      const t = translated[k++] ?? pre[k - 1];

      const finalText = lead + t + tail;

      if (item.kind === "text") {
        item.node.rawText = finalText;
      } else {
        item.node.setAttribute(item.attr, finalText);
      }
    }

    let out = root.toString();

    if (rtl) {
      out = out.replace(/<html\b(?![^>]*\bdir=)[^>]*>/i, (m0) => m0.replace(/>$/, ' dir="rtl">'));
      out = out.replace(/<body\b(?![^>]*\bdir=)[^>]*>/i, (m0) => m0.replace(/>$/, ' dir="rtl">'));
    }

    return res.status(200).json({ html: out });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
