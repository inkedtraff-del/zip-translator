import OpenAI from "openai";
import { parse } from "@babel/parser";
import traverseImport from "@babel/traverse";
import * as generatorNS from "@babel/generator";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const traverse = traverseImport.default ?? traverseImport;

/* ---------------- generator unwrap ---------------- */

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

let generate = unwrapGenerator(generatorNS);
if (typeof generate !== "function") {
  try {
    generate = unwrapGenerator(require("@babel/generator"));
  } catch {}
}

const GENERATOR_OK = typeof generate === "function";

/* ---------------- SAFETY FILTERS ---------------- */

function looksLikePathOrCode(s) {
  const t = s.trim();
  if (!t) return true;
  if (/^(https?:\/\/|mailto:|tel:|\/|\.{1,2}\/|#)/i.test(t)) return true;
  if (/[{}[\];=<>]/.test(t) && t.length < 80) return true;
  return false;
}

function isSelectorLike(s) {
  const t = s.trim();
  if (/^[.#\[]/.test(t)) return true;
  if (/[>~+]/.test(t)) return true;
  if (/:{1,2}[a-z-]+/i.test(t)) return true;
  return false;
}

function isKeyLike(s) {
  const t = s.trim();
  if (/^(click|submit|scroll|load|DOMContentLoaded)$/i.test(t)) return true;
  if (/^(utm_|ga_|gtm_|fbq|dataLayer)/i.test(t)) return true;
  if (/^[A-Za-z0-9_-]{1,64}$/.test(t)) return true;
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(t)) return true;
  if (/^[A-Za-z0-9]+(-[A-Za-z0-9]+)+$/.test(t)) return true;
  return false;
}

const SKIP_METHODS = new Set([
  "querySelector",
  "querySelectorAll",
  "getElementById",
  "getElementsByClassName",
  "addEventListener",
  "removeEventListener",
  "setAttribute",
  "getAttribute",
  "fetch",
  "open",
  "send",
  "getItem",
  "setItem"
]);

/* ---------------- TRANSLATE ---------------- */

async function translateBatch(openai, strings, targetLang) {
  if (!strings.length) return [];

  const resp = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Translate ONLY human UI text. Do NOT translate selectors, code, keys, events, URLs. Return JSON {translations:[]}"
      },
      {
        role: "user",
        content: JSON.stringify({ targetLang, strings })
      }
    ]
  });

  const raw = resp.choices?.[0]?.message?.content || "{}";
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data.translations) ? data.translations : strings;
  } catch {
    return strings;
  }
}

/* ---------------- API HANDLER ---------------- */

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!process.env.OPENAI_API_KEY)
    return res.status(500).json({ error: "OPENAI_API_KEY not set" });

  const { code, targetLang } = req.body || {};
  if (typeof code !== "string" || !targetLang)
    return res.status(400).json({ error: "Bad request" });

  if (!GENERATOR_OK) return res.json({ code });

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const ast = parse(code, {
      sourceType: "unambiguous",
      plugins: ["jsx", "typescript"]
    });

    const items = [];
    const texts = [];
    const seen = new Map();

    function collect(node, value) {
      const t = value.trim();
      if (!t) return;
      if (looksLikePathOrCode(t)) return;
      if (isSelectorLike(t)) return;
      if (isKeyLike(t)) return;

      let idx = seen.get(t);
      if (idx === undefined) {
        idx = texts.length;
        texts.push(t);
        seen.set(t, idx);
      }
      items.push({ node, idx });
    }

    traverse(ast, {
      StringLiteral(path) {
        const node = path.node;
        const parent = path.parent;

        if (
          parent?.type === "CallExpression" &&
          parent.arguments[0] === node
        ) {
          const callee = parent.callee;
          if (
            callee?.type === "MemberExpression" &&
            !callee.computed &&
            SKIP_METHODS.has(callee.property.name)
          ) {
            return;
          }
        }

        collect(node, node.value);
      },

      JSXText(path) {
        collect(path.node, path.node.value);
      }
    });

    const translated = await translateBatch(openai, texts, targetLang);

    for (const it of items) {
      it.node.value = translated[it.idx] ?? it.node.value;
    }

    const out = generate(ast, { comments: true }).code;
    res.json({ code: out });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
