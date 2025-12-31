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

const LANGS = [
  {
    "code": "ar",
    "name": "Арабский"
  },
  {
    "code": "en",
    "name": "Английский"
  },
  {
    "code": "ru",
    "name": "Русский"
  },
  {
    "code": "it",
    "name": "Итальянский"
  },
  {
    "code": "es",
    "name": "Испанский"
  },
  {
    "code": "fr",
    "name": "Французский"
  },
  {
    "code": "de",
    "name": "Немецкий"
  },
  {
    "code": "pt",
    "name": "Португальский"
  },
  {
    "code": "tr",
    "name": "Турецкий"
  },
  {
    "code": "fa",
    "name": "Персидский"
  },
  {
    "code": "ur",
    "name": "Урду"
  },
  {
    "code": "hi",
    "name": "Хинди"
  },
  {
    "code": "bn",
    "name": "Бенгальский"
  },
  {
    "code": "id",
    "name": "Индонезийский"
  },
  {
    "code": "ms",
    "name": "Малайский"
  },
  {
    "code": "th",
    "name": "Тайский"
  },
  {
    "code": "vi",
    "name": "Вьетнамский"
  },
  {
    "code": "zh",
    "name": "Китайский (упр.)"
  },
  {
    "code": "zh-Hant",
    "name": "Китайский (традиц.)"
  },
  {
    "code": "ja",
    "name": "Японский"
  },
  {
    "code": "ko",
    "name": "Корейский"
  },
  {
    "code": "nl",
    "name": "Нидерландский"
  },
  {
    "code": "sv",
    "name": "Шведский"
  },
  {
    "code": "no",
    "name": "Норвежский"
  },
  {
    "code": "da",
    "name": "Датский"
  },
  {
    "code": "fi",
    "name": "Финский"
  },
  {
    "code": "pl",
    "name": "Польский"
  },
  {
    "code": "cs",
    "name": "Чешский"
  },
  {
    "code": "sk",
    "name": "Словацкий"
  },
  {
    "code": "hu",
    "name": "Венгерский"
  },
  {
    "code": "ro",
    "name": "Румынский"
  },
  {
    "code": "bg",
    "name": "Болгарский"
  },
  {
    "code": "uk",
    "name": "Украинский"
  },
  {
    "code": "el",
    "name": "Греческий"
  },
  {
    "code": "he",
    "name": "Иврит"
  },
  {
    "code": "sr",
    "name": "Сербский"
  },
  {
    "code": "hr",
    "name": "Хорватский"
  },
  {
    "code": "sl",
    "name": "Словенский"
  },
  {
    "code": "lt",
    "name": "Литовский"
  },
  {
    "code": "lv",
    "name": "Латышский"
  },
  {
    "code": "et",
    "name": "Эстонский"
  },
  {
    "code": "ca",
    "name": "Каталанский"
  },
  {
    "code": "eu",
    "name": "Баскский"
  },
  {
    "code": "gl",
    "name": "Галисийский"
  },
  {
    "code": "is",
    "name": "Исландский"
  },
  {
    "code": "ga",
    "name": "Ирландский"
  },
  {
    "code": "cy",
    "name": "Валлийский"
  },
  {
    "code": "sw",
    "name": "Суахили"
  },
  {
    "code": "am",
    "name": "Амхарский"
  },
  {
    "code": "ha",
    "name": "Хауса"
  },
  {
    "code": "yo",
    "name": "Йоруба"
  },
  {
    "code": "ig",
    "name": "Игбо"
  },
  {
    "code": "zu",
    "name": "Зулу"
  },
  {
    "code": "af",
    "name": "Африкаанс"
  },
  {
    "code": "sq",
    "name": "Албанский"
  },
  {
    "code": "hy",
    "name": "Армянский"
  },
  {
    "code": "az",
    "name": "Азербайджанский"
  },
  {
    "code": "ka",
    "name": "Грузинский"
  },
  {
    "code": "kk",
    "name": "Казахский"
  },
  {
    "code": "ky",
    "name": "Киргизский"
  },
  {
    "code": "mn",
    "name": "Монгольский"
  },
  {
    "code": "ne",
    "name": "Непальский"
  },
  {
    "code": "si",
    "name": "Сингальский"
  },
  {
    "code": "ta",
    "name": "Тамильский"
  },
  {
    "code": "te",
    "name": "Телугу"
  },
  {
    "code": "kn",
    "name": "Каннада"
  },
  {
    "code": "ml",
    "name": "Малаялам"
  },
  {
    "code": "mr",
    "name": "Маратхи"
  },
  {
    "code": "gu",
    "name": "Гуджарати"
  },
  {
    "code": "pa",
    "name": "Панджаби"
  },
  {
    "code": "km",
    "name": "Кхмерский"
  },
  {
    "code": "lo",
    "name": "Лаосский"
  },
  {
    "code": "my",
    "name": "Бирманский"
  },
  {
    "code": "fil",
    "name": "Филиппинский"
  },
  {
    "code": "ps",
    "name": "Пушту"
  },
  {
    "code": "uz",
    "name": "Узбекский"
  },
  {
    "code": "tk",
    "name": "Туркменский"
  },
  {
    "code": "eo",
    "name": "Эсперанто"
  },
  {
    "code": "la",
    "name": "Латынь"
  }
];
const CURS  = [
  {
    "code": "SAR",
    "name": "Саудовский риял"
  },
  {
    "code": "AED",
    "name": "Дирхам ОАЭ"
  },
  {
    "code": "QAR",
    "name": "Катарский риял"
  },
  {
    "code": "KWD",
    "name": "Кувейтский динар"
  },
  {
    "code": "BHD",
    "name": "Бахрейнский динар"
  },
  {
    "code": "OMR",
    "name": "Оманский риал"
  },
  {
    "code": "USD",
    "name": "Доллар США"
  },
  {
    "code": "EUR",
    "name": "Евро"
  },
  {
    "code": "GBP",
    "name": "Фунт стерлингов"
  },
  {
    "code": "TRY",
    "name": "Турецкая лира"
  },
  {
    "code": "EGP",
    "name": "Египетский фунт"
  },
  {
    "code": "JOD",
    "name": "Иорданский динар"
  },
  {
    "code": "MAD",
    "name": "Марокканский дирхам"
  },
  {
    "code": "TND",
    "name": "Тунисский динар"
  },
  {
    "code": "DZD",
    "name": "Алжирский динар"
  },
  {
    "code": "IQD",
    "name": "Иракский динар"
  },
  {
    "code": "INR",
    "name": "Индийская рупия"
  },
  {
    "code": "PKR",
    "name": "Пакистанская рупия"
  },
  {
    "code": "BDT",
    "name": "Бангладешская така"
  },
  {
    "code": "CNY",
    "name": "Китайский юань"
  },
  {
    "code": "JPY",
    "name": "Японская иена"
  },
  {
    "code": "KRW",
    "name": "Южнокорейская вона"
  },
  {
    "code": "CAD",
    "name": "Канадский доллар"
  },
  {
    "code": "AUD",
    "name": "Австралийский доллар"
  },
  {
    "code": "NZD",
    "name": "Новозеландский доллар"
  },
  {
    "code": "RUB",
    "name": "Российский рубль"
  },
  {
    "code": "UAH",
    "name": "Украинская гривна"
  },
  {
    "code": "KZT",
    "name": "Казахстанский тенге"
  },
  {
    "code": "GEL",
    "name": "Грузинский лари"
  },
  {
    "code": "AMD",
    "name": "Армянский драм"
  },
  {
    "code": "AZN",
    "name": "Азербайджанский манат"
  },
  {
    "code": "BYN",
    "name": "Белорусский рубль"
  },
  {
    "code": "CHF",
    "name": "Швейцарский франк"
  },
  {
    "code": "SEK",
    "name": "Шведская крона"
  },
  {
    "code": "NOK",
    "name": "Норвежская крона"
  },
  {
    "code": "DKK",
    "name": "Датская крона"
  },
  {
    "code": "PLN",
    "name": "Польский злотый"
  },
  {
    "code": "CZK",
    "name": "Чешская крона"
  },
  {
    "code": "HUF",
    "name": "Венгерский форинт"
  },
  {
    "code": "RON",
    "name": "Румынский лей"
  },
  {
    "code": "BGN",
    "name": "Болгарский лев"
  },
  {
    "code": "ILS",
    "name": "Новый израильский шекель"
  },
  {
    "code": "IRR",
    "name": "Иранский риал"
  },
  {
    "code": "YER",
    "name": "Йеменский риал"
  },
  {
    "code": "KES",
    "name": "Кенийский шиллинг"
  },
  {
    "code": "NGN",
    "name": "Нигерийская найра"
  },
  {
    "code": "GHS",
    "name": "Ганский седи"
  },
  {
    "code": "ZAR",
    "name": "Южноафриканский рэнд"
  },
  {
    "code": "BRL",
    "name": "Бразильский реал"
  },
  {
    "code": "ARS",
    "name": "Аргентинский песо"
  },
  {
    "code": "CLP",
    "name": "Чилийский песо"
  },
  {
    "code": "COP",
    "name": "Колумбийский песо"
  },
  {
    "code": "MXN",
    "name": "Мексиканский песо"
  },
  {
    "code": "PEN",
    "name": "Перуанский соль"
  },
  {
    "code": "UYU",
    "name": "Уругвайский песо"
  },
  {
    "code": "THB",
    "name": "Тайский бат"
  },
  {
    "code": "VND",
    "name": "Вьетнамский донг"
  },
  {
    "code": "IDR",
    "name": "Индонезийская рупия"
  },
  {
    "code": "MYR",
    "name": "Малайзийский ринггит"
  },
  {
    "code": "SGD",
    "name": "Сингапурский доллар"
  },
  {
    "code": "HKD",
    "name": "Гонконгский доллар"
  },
  {
    "code": "TWD",
    "name": "Новый тайваньский доллар"
  },
  {
    "code": "PHP",
    "name": "Филиппинский песо"
  },
  {
    "code": "LKR",
    "name": "Шри-ланкийская рупия"
  },
  {
    "code": "NPR",
    "name": "Непальская рупия"
  },
  {
    "code": "ETB",
    "name": "Эфиопский быр"
  },
  {
    "code": "XOF",
    "name": "Франк КФА BCEAO"
  },
  {
    "code": "XAF",
    "name": "Франк КФА BEAC"
  }
];
const COUNTRIES = [
  {
    "iso2": "SA",
    "name": "Саудовская Аравия",
    "currency": "SAR",
    "lang": "ar",
    "rtl": true
  },
  {
    "iso2": "AE",
    "name": "ОАЭ",
    "currency": "AED",
    "lang": "ar",
    "rtl": true
  },
  {
    "iso2": "QA",
    "name": "Катар",
    "currency": "QAR",
    "lang": "ar",
    "rtl": true
  },
  {
    "iso2": "KW",
    "name": "Кувейт",
    "currency": "KWD",
    "lang": "ar",
    "rtl": true
  },
  {
    "iso2": "BH",
    "name": "Бахрейн",
    "currency": "BHD",
    "lang": "ar",
    "rtl": true
  },
  {
    "iso2": "OM",
    "name": "Оман",
    "currency": "OMR",
    "lang": "ar",
    "rtl": true
  },
  {
    "iso2": "EG",
    "name": "Египет",
    "currency": "EGP",
    "lang": "ar",
    "rtl": true
  },
  {
    "iso2": "JO",
    "name": "Иордания",
    "currency": "JOD",
    "lang": "ar",
    "rtl": true
  },
  {
    "iso2": "MA",
    "name": "Марокко",
    "currency": "MAD",
    "lang": "ar",
    "rtl": true
  },
  {
    "iso2": "TN",
    "name": "Тунис",
    "currency": "TND",
    "lang": "ar",
    "rtl": true
  },
  {
    "iso2": "DZ",
    "name": "Алжир",
    "currency": "DZD",
    "lang": "ar",
    "rtl": true
  },
  {
    "iso2": "IQ",
    "name": "Ирак",
    "currency": "IQD",
    "lang": "ar",
    "rtl": true
  },
  {
    "iso2": "TR",
    "name": "Турция",
    "currency": "TRY",
    "lang": "tr",
    "rtl": false
  },
  {
    "iso2": "IL",
    "name": "Израиль",
    "currency": "ILS",
    "lang": "he",
    "rtl": true
  },
  {
    "iso2": "IT",
    "name": "Италия",
    "currency": "EUR",
    "lang": "it",
    "rtl": false
  },
  {
    "iso2": "GB",
    "name": "Великобритания",
    "currency": "GBP",
    "lang": "en",
    "rtl": false
  },
  {
    "iso2": "US",
    "name": "США",
    "currency": "USD",
    "lang": "en",
    "rtl": false
  },
  {
    "iso2": "CA",
    "name": "Канада",
    "currency": "CAD",
    "lang": "en",
    "rtl": false
  },
  {
    "iso2": "AU",
    "name": "Австралия",
    "currency": "AUD",
    "lang": "en",
    "rtl": false
  },
  {
    "iso2": "FR",
    "name": "Франция",
    "currency": "EUR",
    "lang": "fr",
    "rtl": false
  },
  {
    "iso2": "DE",
    "name": "Германия",
    "currency": "EUR",
    "lang": "de",
    "rtl": false
  },
  {
    "iso2": "ES",
    "name": "Испания",
    "currency": "EUR",
    "lang": "es",
    "rtl": false
  },
  {
    "iso2": "PT",
    "name": "Португалия",
    "currency": "EUR",
    "lang": "pt",
    "rtl": false
  },
  {
    "iso2": "NL",
    "name": "Нидерланды",
    "currency": "EUR",
    "lang": "nl",
    "rtl": false
  },
  {
    "iso2": "SE",
    "name": "Швеция",
    "currency": "SEK",
    "lang": "sv",
    "rtl": false
  },
  {
    "iso2": "NO",
    "name": "Норвегия",
    "currency": "NOK",
    "lang": "no",
    "rtl": false
  },
  {
    "iso2": "DK",
    "name": "Дания",
    "currency": "DKK",
    "lang": "da",
    "rtl": false
  },
  {
    "iso2": "FI",
    "name": "Финляндия",
    "currency": "EUR",
    "lang": "fi",
    "rtl": false
  },
  {
    "iso2": "PL",
    "name": "Польша",
    "currency": "PLN",
    "lang": "pl",
    "rtl": false
  },
  {
    "iso2": "CZ",
    "name": "Чехия",
    "currency": "CZK",
    "lang": "cs",
    "rtl": false
  },
  {
    "iso2": "HU",
    "name": "Венгрия",
    "currency": "HUF",
    "lang": "hu",
    "rtl": false
  },
  {
    "iso2": "RO",
    "name": "Румыния",
    "currency": "RON",
    "lang": "ro",
    "rtl": false
  },
  {
    "iso2": "BG",
    "name": "Болгария",
    "currency": "BGN",
    "lang": "bg",
    "rtl": false
  },
  {
    "iso2": "UA",
    "name": "Украина",
    "currency": "UAH",
    "lang": "uk",
    "rtl": false
  },
  {
    "iso2": "RU",
    "name": "Россия",
    "currency": "RUB",
    "lang": "ru",
    "rtl": false
  },
  {
    "iso2": "GE",
    "name": "Грузия",
    "currency": "GEL",
    "lang": "ka",
    "rtl": false
  },
  {
    "iso2": "AM",
    "name": "Армения",
    "currency": "AMD",
    "lang": "hy",
    "rtl": false
  },
  {
    "iso2": "AZ",
    "name": "Азербайджан",
    "currency": "AZN",
    "lang": "az",
    "rtl": false
  },
  {
    "iso2": "KZ",
    "name": "Казахстан",
    "currency": "KZT",
    "lang": "kk",
    "rtl": false
  },
  {
    "iso2": "IN",
    "name": "Индия",
    "currency": "INR",
    "lang": "hi",
    "rtl": false
  },
  {
    "iso2": "PK",
    "name": "Пакистан",
    "currency": "PKR",
    "lang": "ur",
    "rtl": false
  },
  {
    "iso2": "BD",
    "name": "Бангладеш",
    "currency": "BDT",
    "lang": "bn",
    "rtl": false
  },
  {
    "iso2": "CN",
    "name": "Китай",
    "currency": "CNY",
    "lang": "zh",
    "rtl": false
  },
  {
    "iso2": "JP",
    "name": "Япония",
    "currency": "JPY",
    "lang": "ja",
    "rtl": false
  },
  {
    "iso2": "KR",
    "name": "Южная Корея",
    "currency": "KRW",
    "lang": "ko",
    "rtl": false
  },
  {
    "iso2": "ID",
    "name": "Индонезия",
    "currency": "IDR",
    "lang": "id",
    "rtl": false
  },
  {
    "iso2": "MY",
    "name": "Малайзия",
    "currency": "MYR",
    "lang": "ms",
    "rtl": false
  },
  {
    "iso2": "SG",
    "name": "Сингапур",
    "currency": "SGD",
    "lang": "en",
    "rtl": false
  },
  {
    "iso2": "TH",
    "name": "Таиланд",
    "currency": "THB",
    "lang": "th",
    "rtl": false
  },
  {
    "iso2": "VN",
    "name": "Вьетнам",
    "currency": "VND",
    "lang": "vi",
    "rtl": false
  },
  {
    "iso2": "BR",
    "name": "Бразилия",
    "currency": "BRL",
    "lang": "pt",
    "rtl": false
  },
  {
    "iso2": "MX",
    "name": "Мексика",
    "currency": "MXN",
    "lang": "es",
    "rtl": false
  },
  {
    "iso2": "AR",
    "name": "Аргентина",
    "currency": "ARS",
    "lang": "es",
    "rtl": false
  },
  {
    "iso2": "ZA",
    "name": "ЮАР",
    "currency": "ZAR",
    "lang": "en",
    "rtl": false
  },
  {
    "iso2": "NG",
    "name": "Нигерия",
    "currency": "NGN",
    "lang": "en",
    "rtl": false
  },
  {
    "iso2": "KE",
    "name": "Кения",
    "currency": "KES",
    "lang": "en",
    "rtl": false
  }
];

const els = {
  zip: document.getElementById("zip"),
  zipName: document.getElementById("zipName"),
  statusZip: document.getElementById("statusZip"),
  goZip: document.getElementById("goZip"),
  downloadZip: document.getElementById("downloadZip"),

  lang: document.getElementById("lang"),
  langCustom: document.getElementById("langCustom"),
  currency: document.getElementById("currency"),
  country: document.getElementById("country"),
  rtl: document.getElementById("rtl"),

  fromBrand: document.getElementById("fromBrand"),
  toBrand: document.getElementById("toBrand"),
  fromCountry: document.getElementById("fromCountry"),
  toCountry: document.getElementById("toCountry"),
  fromCurrency: document.getElementById("fromCurrency"),
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
    code: c.code,
    name: `${flagEmoji(c.code)} ${c.name}`
  }));
  populateSelect(els.country, items);
}

function populateLangs() {
  populateSelect(els.lang, LANGS);
}

function findCountry(code) {
  return COUNTRIES.find(c => c.code === code) || null;
}

function applyCountryDefaults() {
  const c = findCountry(els.country.value);
  if (!c) return;
  if (c.currency && !els.currency.value) els.currency.value = c.currency;
  els.rtl.checked = !!c.rtl;
}

populateCountries();
populateLangs();
applyCountryDefaults();

els.country.addEventListener("change", () => {
  // auto-fill currency/rtl but don't overwrite user's currency if already set
  const prev = (els.currency.value || "").trim();
  const c = findCountry(els.country.value);
  if (!c) return;
  if (!prev && c.currency) els.currency.value = c.currency;
  els.rtl.checked = !!c.rtl;
});

els.zip.addEventListener("change", () => {
  const f = els.zip.files?.[0];
  els.zipName.textContent = f ? f.name : "Архив не выбран";
  els.downloadZip.style.display = "none";
  els.downloadZip.href = "#";
});

function getTargetLang() {
  return (els.langCustom.value || "").trim() || els.lang.value;
}

function getRules() {
  return {
    brand: { enabled: true, from: els.fromBrand.value.trim(), to: els.toBrand.value.trim() },
    country: { enabled: true, from: els.fromCountry.value.trim(), to: els.toCountry.value.trim(), iso2: els.country.value },
    currency: { enabled: true, from: els.fromCurrency.value.trim(), to: (els.currency.value || "").trim() }
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
  // skip obvious bundles/minified to reduce risk & cost
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
  } catch (e) {
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

    if (entry.dir) {
      continue;
    }

    

    // skip macOS junk (__MACOSX and ._ files), keep as-is
    if (isMacJunkPath(name)) {
      const buf = await entry.async("arraybuffer");
      out.file(name, buf);
      skipped++;
      continue;
    }
// Always preserve original path/name
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
        // copy as binary
        const buf = await entry.async("arraybuffer");
        out.file(name, buf);
        skipped++;
      }
    } catch (e) {
      // Stop early with a clear message, including file name
      writeStatus(`Ошибка на файле: ${name}\n${e?.message || String(e)}`);
      return;
    }
  }

  writeStatus(`Готово.\nПереведено: ${translated}\nПропущено: ${skipped}`);

  const blob = await out.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);

  const base = (f.name || "archive.zip").replace(/\.zip$/i, "");
  const safeLang = (targetLang || "lang").replace(/[^a-z0-9_-]+/gi, "_");
  els.downloadZip.href = url;
  els.downloadZip.download = `${base}_${safeLang}.zip`;
  els.downloadZip.style.display = "inline-flex";
});
