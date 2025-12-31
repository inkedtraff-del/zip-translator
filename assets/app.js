function isMacJunkPath(p) {
  if (!p) return false;
  const s = String(p).replaceAll("\\", "/");
  return (
    s.includes("/__MACOSX/") ||
    s.startsWith("__MACOSX/") ||
    s.split("/").some(seg => seg.startsWith("._")) ||
    s.startsWith("._")
  );
}

// ⚠️ Я дал короткие списки, чтобы не грузить чат на тысячи строк.
// Если хочешь — просто вставь свои полные LANGS/COUNTRIES обратно (логика не поменяется).
const LANGS = [
  { code: "ar", name: "Арабский" },
  { code: "en", name: "Английский" },
  { code: "ru", name: "Русский" },
  { code: "it", name: "Итальянский" },
  { code: "es", name: "Испанский" },
  { code: "fr", name: "Французский" },
  { code: "de", name: "Немецкий" },
  { code: "pt", name: "Португальский" },
  { code: "tr", name: "Турецкий" }
];

// ВАЖНО: у страны поле iso2 (как у тебя в большом списке).
const COUNTRIES = [
  { iso2: "SA", name: "Саудовская Аравия", lang: "ar", rtl: true },
  { iso2: "AE", name: "ОАЭ", lang: "ar", rtl: true },
  { iso2: "IT", name: "Италия", lang: "it", rtl: false },
  { iso2: "US", name: "США", lang: "en", rtl: false },
  { iso2: "GB", name: "Великобритания", lang: "en", rtl: false },
  { iso2: "RU", name: "Россия", lang: "ru", rtl: false }
];

const els = {
  zip: document.getElementById("zip"),
  zipName: document.getElementById("zipName"),
  statusZip: document.getElementById("statusZip"),
  goZip: document.getElementById("goZip"),
  downloadZip: document.getElementById("downloadZip"),

  outName: document.getElementById("outName"),

  lang: document.getElementById("lang"),
  country: document.getElementById("country"),
  rtl: document.getElementById("rtl"),

  fromBrand: document.getElementById("fromBrand"),
  toBrand: document.getElementById("toBrand"),
  fromCountry: document.getElementById("fromCountry"),
  toCountry: document.getElementById("toCountry"),
};

function flagEmoji(iso2) {
  if (!iso2 || iso2.length !== 2) return "";
  const A = 0x1F1E6;
  const cps = [...iso2.toUpperCase()].map(c => A + (c.charCodeAt(0) - 65));
  return String.fromCodePoint(...cps);
}

function populateSelect(select, items, { valueKey = "code", labelKey = "name" } = {}) {
  select.innerHTML = "";
  for (const it of items) {
    const opt = document.createElement("option");
    opt.value = it[valueKey];
    opt.textContent = it[labelKey];
    select.appendChild(opt);
  }
}

function populateCountries() {
  const items = COUNTRIES.map(c => ({
    iso2: c.iso2,
    name: `${flagEmoji(c.iso2)} ${c.name}`
  }));
  populateSelect(els.country, items, { valueKey: "iso2", labelKey: "name" });
}

function populateLangs() {
  populateSelect(els.lang, LANGS);
}

function findCountry(iso2) {
  return COUNTRIES.find(c => c.iso2 === iso2) || null;
}

function applyCountryDefaults() {
  const c = findCountry(els.country.value);
  if (!c) return;
  // ставим RTL по стране (а язык пусть выбирают вручную)
  els.rtl.checked = !!c.rtl;
}

populateCountries();
populateLangs();
applyCountryDefaults();

els.country.addEventListener("change", () => {
  const c = findCountry(els.country.value);
  if (!c) return;
  els.rtl.checked = !!c.rtl;
});

els.zip.addEventListener("change", () => {
  const f = els.zip.files?.[0];
  els.zipName.textContent = f ? f.name : "Архив не выбран";
  els.downloadZip.style.display = "none";
  els.downloadZip.href = "#";
});

function getTargetLang() {
  return (els.lang.value || "").trim();
}

function getRules() {
  return {
    brand: { enabled: true, from: els.fromBrand.value.trim(), to: els.toBrand.value.trim() },
    country: { enabled: true, from: els.fromCountry.value.trim(), to: els.toCountry.value.trim(), iso2: els.country.value }
  };
}

async function translateHtml(html, targetLang, rtl, rules, filePath) {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html, targetLang, rtl, rules, filePath })
  });
  const raw = await res.text();
  let data;
  try { data = JSON.parse(raw); } catch { throw new Error(raw || "Bad response"); }
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data.html;
}

async function translateJs(code, targetLang, filePath) {
  const res = await fetch("/api/translate-js", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, targetLang, filePath })
  });
  const raw = await res.text();
  let data;
  try { data = JSON.parse(raw); } catch { throw new Error(raw || "Bad response"); }
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data.code;
}

function isHtmlFile(name) {
  return /\.html?$/i.test(name);
}
function isJsFile(name) {
  return /\.(mjs|cjs|js|jsx)$/i.test(name);
}
function isProbablyBundle(name) {
  return /\.min\./i.test(name) || /\/dist\//i.test(name) || /\/build\//i.test(name);
}

function writeStatus(msg) {
  els.statusZip.textContent = msg;
}

els.goZip.addEventListener("click", async () => {
  const f = els.zip.files?.[0];
  if (!f) return alert("Выбери ZIP архив (.zip)");

  if (typeof JSZip === "undefined") {
    alert("JSZip не загрузился. Обнови страницу.");
    return;
  }

  const targetLang = getTargetLang();
  const rtl = !!els.rtl.checked;
  const rules = getRules();

  writeStatus("Читаю архив…");

  let zip;
  try {
    zip = await JSZip.loadAsync(f);
  } catch {
    writeStatus("Не удалось прочитать ZIP.");
    return;
  }

  const out = new JSZip();
  const files = Object.values(zip.files);
  const total = files.length;

  let done = 0;
  let translated = 0;
  let skipped = 0;

  for (const entry of files) {
    done++;
    const name = entry.name;

    // НЕ создаём папки вручную — JSZip сам создаст по путям файлов
    if (entry.dir) continue;

    // macOS мусор не переводим, но сохраняем
    if (isMacJunkPath(name)) {
      const buf = await entry.async("arraybuffer");
      out.file(name, buf);
      skipped++;
      continue;
    }

    try {
      if (isHtmlFile(name)) {
        writeStatus(`HTML: ${name} (${done}/${total})`);
        const html = await entry.async("string");
        const newHtml = await translateHtml(html, targetLang, rtl, rules, name);
        out.file(name, newHtml);
        translated++;
      } else if (isJsFile(name) && !isProbablyBundle(name)) {
        writeStatus(`JS: ${name} (${done}/${total})`);
        const code = await entry.async("string");
        const newCode = await translateJs(code, targetLang, name);
        out.file(name, newCode);
        translated++;
      } else {
        const buf = await entry.async("arraybuffer");
        out.file(name, buf);
        skipped++;
      }
    } catch (e) {
      writeStatus(`Ошибка на файле: ${name}\n${e?.message || String(e)}`);
      return;
    }
  }

  writeStatus(`Готово.\nПереведено: ${translated}\nПропущено: ${skipped}`);

  const blob = await out.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);

  const base = (f.name || "archive.zip").replace(/\.zip$/i, "");
  const safeLang = (targetLang || "lang").replace(/[^a-z0-9_-]+/gi, "_");

  const custom = (els.outName?.value || "").trim();
  const safeCustom = custom.replace(/\.zip$/i, "").replace(/[^a-z0-9 _-]+/gi, "_").trim();

  const finalName = safeCustom ? safeCustom : `${base}_${safeLang}`;

  els.downloadZip.href = url;
  els.downloadZip.download = `${finalName}.zip`;
  els.downloadZip.style.display = "inline-flex";
});
