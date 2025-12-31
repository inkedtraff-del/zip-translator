import OpenAI from "openai";
import { parse } from "@babel/parser";
import traverseImport from "@babel/traverse";
import * as generatorNS from "@babel/generator";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const traverse = traverseImport.default ?? traverseImport;

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

function looksBinaryText(str) {
  if (typeof str !== "string" || !str) return false;
  if (str.includes("\x00")) return true;
  const head = str.slice(0, 2048);
  if (/[\x01-\x08\x0B\x0C\x0E-\x1F]/.test(head)) return true;
  const rep = (head.match(/\uFFFD/g) || []).length;
  if (rep >= 5) return true;
  return false;
}

const SAFE_ATTRS = new Set(["title", "placeholder", "aria-label", "alt", "value"]);
const SAFE_TEXT_PROPS = new Set(["innerText", "textContent", "placeholder", "title", "value", "ariaLabel"]);

// translate only obvious UI text (not selectors/keys)
function normalizeWhitespace(s) {
  if (!s || !String(s).trim()) return s;
  return String(s).replace(/\s+/g, " ").trim();
}
function looksLikePathOrCode(s) {
  const t = s.trim();
  if (!t) return true;
  if (/^(https?:\/\/|mailto:|tel:|\/|\.{1,2}\/|#)/i.test(t)) return true;
  if (/[{}[\];=<>]/.test(t) && t.length < 80) return true;
  return false;
}

async function translateBatch(openai, strings, targetLang) {
  if (!strings.length) return [];
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const resp = await openai.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Translate ONLY human-visible UI text. DO NOT translate selectors, event names, keys, URLs, code. Return ONLY JSON: {translations:[...]} same length/order."
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
    const arr = Array.isArray(data.translations) ? data.translations : null;
    if (!arr || arr.length !== strings.length) return strings;
    return arr.map((x, i) => (typeof x === "string" ? x : strings[i]));
  } catch {
    return strings;
  }
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY not set in Vercel env vars." });
  }

  try {
    const { code, targetLang } = req.body || {};
    if (typeof code !== "string" || !targetLang) {
      return res.status(400).json({ error: "Missing code or targetLang" });
    }

    // never crash on weird/binary “._*” files
    if (looksBinaryText(code)) return res.status(200).json({ code });

    // if generator missing, return unchanged
    if (!GENERATOR_OK) return res.status(200).json({ code });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const ast = parse(code, {
      sourceType: "unambiguous",
      plugins: ["jsx", "typescript", "classProperties", "dynamicImport", "topLevelAwait"]
    });

    // collect only whitelisted contexts
    const items = [];
    const texts = [];
    const seen = new Map();

    function addText(get, set) {
      const v = get();
      if (typeof v !== "string") return;
      const norm = normalizeWhitespace(v);
      if (!norm) return;
      if (looksLikePathOrCode(norm)) return;

      let idx = seen.get(norm);
      if (idx === undefined) {
        idx = texts.length;
        seen.set(norm, idx);
        texts.push(norm);
      }
      items.push({ get, set, idx, original: v });
    }

    traverse(ast, {
      // ✅ JSX text: <button>Click</button>
      JSXText(path) {
        const node = path.node;
        addText(
          () => node.value,
          (t) => {
            node.value = t;
          }
        );
      },

      // ✅ JSX attr: <img alt="..."> <button title="...">
      JSXAttribute(path) {
        const node = path.node;
        const name = node.name?.name;
        const val = node.value;
        if (!name || !SAFE_ATTRS.has(String(name))) return;
        if (!val || val.type !== "StringLiteral") return;

        addText(
          () => val.value,
          (t) => {
            val.value = t;
          }
        );
      },

      // ✅ element.innerText = "..."
      AssignmentExpression(path) {
        const node = path.node;
        if (node.operator !== "=") return;

        const left = node.left;
        const right = node.right;

        if (!right || right.type !== "StringLiteral") return;
        if (!left || left.type !== "MemberExpression") return;
        if (left.computed) return;
        if (!left.property || left.property.type !== "Identifier") return;

        const prop = left.property.name;
        if (!SAFE_TEXT_PROPS.has(prop)) return;

        addText(
          () => right.value,
          (t) => {
            right.value = t;
          }
        );
      },

      // ✅ el.setAttribute("title", "...")
      CallExpression(path) {
        const node = path.node;
        const callee = node.callee;
        const args = node.arguments || [];

        if (!callee || callee.type !== "MemberExpression") return;
        if (callee.computed) return;
        if (!callee.property || callee.property.type !== "Identifier") return;

        const method = callee.property.name;
        if (method !== "setAttribute") return;
        if (args.length < 2) return;

        const a0 = args[0];
        const a1 = args[1];
        if (!a0 || a0.type !== "StringLiteral") return;
        if (!a1 || a1.type !== "StringLiteral") return;

        const attrName = String(a0.value || "").toLowerCase();
        if (!SAFE_ATTRS.has(attrName)) return;

        addText(
          () => a1.value,
          (t) => {
            a1.value = t;
          }
        );
      }
    });

    const translations = await translateBatch(openai, texts, targetLang);

    for (const it of items) {
      const origFull = it.original;
      const m = String(origFull).match(/^(\s*)([\s\S]*?)(\s*)$/);
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
