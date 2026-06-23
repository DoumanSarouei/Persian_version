import { useEffect, useState } from "react";

type Fields = Record<string, unknown>;

interface ApiResponse {
  id: string;
  fields: Fields;
}

interface ApiError {
  error: string;
}

function asString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(asString).filter(Boolean).join("، ");
  return String(v);
}

function firstNonEmpty(...values: string[]): string {
  return (
    values.find((v) => typeof v === "string" && v.trim().length > 0)?.trim() ?? ""
  );
}

function isNoMajorNeed(need: string): boolean {
  const n = need.trim().toLowerCase();
  return (
    n === "no major unmet need" ||
    n === "no_major_gap" ||
    n === "no major gap" ||
    n === "no major need" ||
    n === "no_major_need" ||
    need.trim() === "نیاز برآورده‌نشده‌ی برجسته‌ای دیده نمی‌شود" ||
    need.trim() === "قابل تفسیر نیست"
  );
}

// Map raw need codes (and common English) to Persian labels.
function formatNeed(need: string): string {
  if (!need) return "";
  const map: Record<string, string> = {
    CONN: "ارتباط",
    AUTO: "خودمختاری / کنترل",
    COMP: "شایستگی / اثربخشی",
    RECOG: "قدردانی / ارزش",
    MEAN: "معنا / هدف",
    SEC: "امنیت / ثبات",
    GROW: "رشد / پیشرفت",
    REC: "بازیابی",
    RECOVERY: "بازیابی",
    NO_MAJOR_GAP: "نیاز برآورده‌نشده‌ی برجسته‌ای دیده نمی‌شود",
    NO_MAJOR_NEED: "نیاز برآورده‌نشده‌ی برجسته‌ای دیده نمی‌شود",
  };
  return map[need.trim().toUpperCase()] ?? need;
}

// Map pattern codes to Persian display names.
function formatPattern(pattern: string): string {
  if (!pattern) return "—";
  const map: Record<string, string> = {
    EFFORT_REWARD_STRAIN: "ناترازی تلاش و پاداش",
    OVERLOAD_RECOVERY_DEFICIT: "فشار زیاد و کمبود بازیابی",
    CONTROL_UNCERTAINTY_STRAIN: "فشار ناشی از کنترل و عدم‌قطعیت",
    THREAT_ANXIETY_STRAIN: "فشار ناشی از تهدید و اضطراب",
    RELATIONAL_SUPPORT_DEFICIT: "کمبود حمایت رابطه‌ای",
    MEANING_VALUE_MISALIGNMENT: "ناهماهنگی معنا و ارزش‌ها",
    RESOURCE_DEPLETION: "تحلیل‌رفتن منابع",
    NO_CLEAR_PATTERN: "الگوی مشخصی دیده نمی‌شود",
    LOW_STRESS_MAINTENANCE: "حفظ وضعیت کم‌استرس",
    LOW_STRESS_WITH_RESOURCE_GAP: "کم‌استرس با کمبود منابع",
    RESPONSE_PATTERN_UNCLEAR: "الگوی پاسخ‌ها نامشخص است",
  };
  return map[pattern.trim().toUpperCase()] ?? pattern;
}

function patternAnchor(pattern: string): string {
  const p = pattern.toUpperCase();
  if (p.includes("MEANING"))
    return "شاید مشکل فشار زیاد نباشد؛ شاید ارتباط شما با معنا کم‌رنگ شده است.";
  if (p.includes("OVERLOAD"))
    return "شاید شکست نخورده‌اید؛ شاید سیستم شما فقط بیش از حد بارگذاری شده است.";
  if (p.includes("CONTROL"))
    return "شاید ضعیف نیستید؛ شاید کنترل کافی در دست شما نیست.";
  if (p.includes("RELATIONAL") || p.includes("CONNECTION"))
    return "شاید بیش‌ازحد حساس نیستید؛ شاید استرس شما ریشه‌ی رابطه‌ای دارد.";
  if (p.includes("EFFORT") || p.includes("REWARD"))
    return "شاید استرس شما از زیاد کار کردن نباشد، بلکه از فاصله میان تلاش و آنچه بازمی‌گردد.";
  if (p.includes("THREAT") || p.includes("ANXIETY"))
    return "شاید سیستم شما سخت در تلاش است تا از شما محافظت کند، حتی وقتی تهدید فوری نیست.";
  if (p.includes("RESOURCE"))
    return "شاید توان مقابله‌ی شما در حال حاضر کمتر از معمول است؛ نه از سر ضعف، بلکه از تحلیل‌رفتن منابع.";
  if (p.includes("LOW_STRESS") || p.includes("MAINTENANCE"))
    return "در حال حاضر فشار خاصی دیده نمی‌شود؛ تمرکز اصلی حفظ همین تعادل خوب است.";
  return "نتیجه‌ی فعلی یک الگوی واقعی را نشان می‌دهد، نه یک نقص شخصی.";
}

function defaultKeyInsight(pattern: string): string {
  const p = pattern.toUpperCase();
  if (p.includes("EFFORT") || p.includes("REWARD"))
    return "استرس شما ممکن است فقط از انجام کار زیاد نباشد، بلکه از ناترازی میان آنچه می‌گذارید و آنچه به‌صورت قدردانی، حمایت، انصاف یا بازخورد عاطفی بازمی‌گردد.";
  if (p.includes("OVERLOAD"))
    return "فشار مداوم بدون بازیابی کافی، به‌تدریج منابعی را که برای تفکر روشن، تنظیم هیجان و حفظ تاب‌آوری لازم است تحلیل می‌برد.";
  if (p.includes("CONTROL") || p.includes("UNCERTAINTY"))
    return "وقتی حس کنترل پایین است، سیستم عصبی در حالت آماده‌باش می‌ماند؛ به‌دنبال تهدید می‌گردد و انرژی‌ای را مصرف می‌کند که می‌توانست صرف تمرکز و بازیابی شود.";
  if (p.includes("RELATIONAL") || p.includes("CONNECTION"))
    return "استرس بین‌فردی اغلب دست‌کم گرفته می‌شود. تنش حل‌نشده‌ی رابطه‌ای یا نبود حمایت واقعی می‌تواند به‌آرامی پاسخ استرس را زنده نگه دارد.";
  if (p.includes("MEANING"))
    return "کارکردن بدون حس معنا یا جهت، استرسی آرام اما پایدار است. انگیزه، درگیری ذهنی و تاب‌آوری تا حدی به این بستگی دارند که حس کنیم تلاش‌مان هدف دارد.";
  if (p.includes("THREAT") || p.includes("ANXIETY"))
    return "وقتی ذهن همواره به‌سمت تهدیدهای احتمالی جهت‌گیری می‌کند، به‌طور پیوسته منابع را مصرف می‌کند، حتی وقتی خطر فوری وجود ندارد.";
  if (p.includes("RESOURCE"))
    return "وقتی منابع تحلیل رفته‌اند، حتی کارهای معمول هم تلاش بیشتری می‌طلبند. اولویت، محافظت و بازسازی ظرفیت است، نه فشار آوردن به خود.";
  if (p.includes("LOW_STRESS") || p.includes("MAINTENANCE"))
    return "وقتی فشار پایین و منابع خوب است، ارزشمندترین کار حفظ همان عادت‌هایی است که اکنون به تعادل شما کمک می‌کنند.";
  return "نتیجه‌ی فعلی یک الگوی معنادار را نشان می‌دهد. فهمیدن آنچه آن را پیش می‌برد، نخستین گام به‌سوی بازیابی هدفمند است.";
}

function startHereText(pattern: string): string {
  const p = pattern.toUpperCase();
  if (p.includes("MEANING"))
    return "با بهره‌وری شروع نکنید. با پیوند دوباره شروع کنید: همین حالا چه چیزی برای شما واقعاً معنا دارد؟";
  if (p.includes("OVERLOAD"))
    return "با بهینه‌سازی شروع نکنید. با بازیابی شروع کنید: قبل از اینکه از خود بیشتر بخواهید، بار را کم کنید.";
  if (p.includes("CONTROL"))
    return "با کمال‌گرایی شروع نکنید. با کنترل شروع کنید: یک حوزه را پیدا کنید که می‌توانید بر گام بعدی آن اثر بگذارید.";
  if (p.includes("RELATIONAL") || p.includes("CONNECTION"))
    return "با درست‌کردن همه‌چیز شروع نکنید. با یک نیاز رابطه‌ای صادقانه یا یک تماس حمایتی امن شروع کنید.";
  if (p.includes("EFFORT") || p.includes("REWARD"))
    return "با شناسایی یک حوزه شروع کنید که تلاش شما در آن منصفانه پاسخ نمی‌گیرد، و ببینید یک ترازِ کوچک چه شکلی می‌تواند داشته باشد.";
  if (p.includes("THREAT") || p.includes("ANXIETY"))
    return "با امنیت و آرام‌سازی شروع کنید، نه با حل مسئله. چه چیزی به آرام‌شدن سیستم شما کمک می‌کند؟";
  if (p.includes("RESOURCE"))
    return "با بازسازی شروع کنید، نه با عملکرد. کوچک‌ترین اقدام بازیابی که امروز در دسترس شماست چیست؟";
  if (p.includes("LOW_STRESS") || p.includes("MAINTENANCE"))
    return "با یک عادت کوچک که اکنون به تعادل شما کمک می‌کند شروع کنید و از آن محافظت کنید.";
  return "با کوچک‌ترین گام بعدی شروع کنید که استرس را کم و وضوح را بیشتر می‌کند.";
}

type LoopStep = { step: number; text: string };

function getStressLoop(pattern: string): LoopStep[] {
  const p = pattern.toUpperCase();

  if (p.includes("EFFORT") || p.includes("REWARD")) {
    return [
      { step: 1, text: "تلاش / مسئولیت زیاد" },
      { step: 2, text: "قدردانی، بازگشت یا حس ارزش کافی نیست" },
      { step: 3, text: "فشار هیجانی، نگرانی یا کاهش بازیابی" },
      { step: 4, text: "تلاش بیشتر، فکرِ زیاد، یا کناره‌گیری" },
      { step: 5, text: "تلاش بیشتر بدون بازگشت کافی" },
    ];
  }
  if (p.includes("OVERLOAD")) {
    return [
      { step: 1, text: "مطالبات زیاد" },
      { step: 2, text: "بازیابی بسیار کم" },
      { step: 3, text: "خستگی، تنش یا کاهش تمرکز" },
      { step: 4, text: "ادامه‌دادن با فشار یا به‌تعویق‌انداختن استراحت" },
      { step: 5, text: "بدهیِ بازیابی بیشتر می‌شود" },
    ];
  }
  if (p.includes("CONTROL") || p.includes("UNCERTAINTY")) {
    return [
      { step: 1, text: "اثرگذاری نامشخص یا کنترل محدود" },
      { step: 2, text: "پایش و برنامه‌ریزی بیشتر" },
      { step: 3, text: "بار ذهنی افزایش می‌یابد" },
      { step: 4, text: "تصمیم‌گیری سخت‌تر می‌شود" },
      { step: 5, text: "عدم‌قطعیت فعال می‌ماند" },
    ];
  }
  if (p.includes("THREAT") || p.includes("ANXIETY")) {
    return [
      { step: 1, text: "وضعیت پرخطر یا نامطمئن به‌نظر می‌رسد" },
      { step: 2, text: "توجه به‌دنبال آنچه ممکن است اشتباه شود می‌گردد" },
      { step: 3, text: "نگرانی و تنش بدن بیشتر می‌شود" },
      { step: 4, text: "اجتناب، وارسی یا اطمینان‌جویی" },
      { step: 5, text: "حس تهدید زنده می‌ماند" },
    ];
  }
  if (p.includes("RELATIONAL") || p.includes("CONNECTION")) {
    return [
      { step: 1, text: "نیاز به حمایت یا ارتباط" },
      { step: 2, text: "حمایت ناکافی یا نامشخص به‌نظر می‌رسد" },
      { step: 3, text: "ناامیدی، تنهایی یا حساسیت بیشتر می‌شود" },
      { step: 4, text: "کناره‌گیری یا سازگاری بیش‌ازحد" },
      { step: 5, text: "نیاز به ارتباط برآورده‌نشده می‌ماند" },
    ];
  }
  if (p.includes("MEANING")) {
    return [
      { step: 1, text: "تلاش روزمره از ارزش‌ها جدا حس می‌شود" },
      { step: 2, text: "انگیزه افت می‌کند" },
      { step: 3, text: "کارها خالی یا تکراری حس می‌شوند" },
      { step: 4, text: "بی‌انگیزگی یا تعویق" },
      { step: 5, text: "شکاف معنا فعال می‌ماند" },
    ];
  }
  if (p.includes("RESOURCE")) {
    return [
      { step: 1, text: "منابع از پیش کاهش یافته‌اند" },
      { step: 2, text: "مطالبات عادی پرهزینه‌تر حس می‌شوند" },
      { step: 3, text: "بازیابی کم‌اثرتر می‌شود" },
      { step: 4, text: "انرژی کمتری برای مقابله می‌ماند" },
      { step: 5, text: "تحلیل‌رفتن ادامه می‌یابد" },
    ];
  }
  if (p.includes("LOW_STRESS") || p.includes("MAINTENANCE")) {
    return [
      { step: 1, text: "فشار پایین و منابع خوب" },
      { step: 2, text: "بازیابی تا حد خوبی حفظ شده است" },
      { step: 3, text: "عادت‌های سالم در جریان‌اند" },
      { step: 4, text: "تعادل پایدار می‌ماند" },
      { step: 5, text: "حفظ همین وضعیت، اولویت است" },
    ];
  }
  return [
    { step: 1, text: "فشار مداوم یا نیاز برآورده‌نشده" },
    { step: 2, text: "کاهش ظرفیت پاسخ‌دهی" },
    { step: 3, text: "پاسخ استرس فعال می‌ماند" },
    { step: 4, text: "مقابله کم‌اثرتر می‌شود" },
    { step: 5, text: "الگو خودش را تقویت می‌کند" },
  ];
}

function truncateToTwoSentences(text: string): string {
  if (!text) return "";
  // Persian sentence terminators: . ! ? ؟ plus the line. Keep simple.
  const sentences = text.match(/[^.!?؟]+[.!?؟]+/g) ?? [];
  if (sentences.length <= 2) return text.trim();
  return sentences.slice(0, 2).join(" ").trim();
}

function isSafePressureSource(raw: string): boolean {
  if (!raw) return false;
  const v = raw.trim().toLowerCase();
  return (
    v !== "" &&
    v !== "press" &&
    v !== "empty" &&
    v !== "null" &&
    v !== "undefined" &&
    v !== "n/a" &&
    v !== "-"
  );
}

type ChartItem = { label: string; value: number };

function safeNum(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatReportDate(raw: string): string {
  const value = (raw || "").trim();
  const opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  if (!value) return new Date().toLocaleDateString("fa-IR", opts);
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("fa-IR", opts);
}

function toGapPct(raw: number): number {
  return Math.round(Math.min(Math.max((raw / 4) * 100, 0), 100));
}

function toResourcePct(raw: number): number {
  return Math.round(Math.min(Math.max(((raw - 1) / 4) * 100, 0), 100));
}

function buildNeedGapItems(get: (k: string) => string): ChartItem[] {
  return [
    { label: "ارتباط", value: toGapPct(safeNum(get("gap_conn"))) },
    { label: "خودمختاری", value: toGapPct(safeNum(get("gap_auto"))) },
    { label: "شایستگی", value: toGapPct(safeNum(get("gap_comp"))) },
    { label: "بازیابی", value: toGapPct(safeNum(get("gap_rec"))) },
    { label: "معنا", value: toGapPct(safeNum(get("gap_mean"))) },
    { label: "امنیت", value: toGapPct(safeNum(get("gap_sec"))) },
    { label: "رشد", value: toGapPct(safeNum(get("gap_grow"))) },
  ];
}

function buildResourceItems(get: (k: string) => string): ChartItem[] {
  return [
    { label: "توان مقابله", value: toResourcePct(safeNum(get("r_int_score"))) },
    { label: "جسمی", value: toResourcePct(safeNum(get("r_phy_score"))) },
    { label: "اجتماعی", value: toResourcePct(safeNum(get("r_soc_score"))) },
    { label: "ساختاری", value: toResourcePct(safeNum(get("r_str_score"))) },
    { label: "معنا", value: toResourcePct(safeNum(get("r_mean_score"))) },
  ];
}

function getHighestItem(items: ChartItem[]): ChartItem | null {
  if (!items.length) return null;
  return items.reduce((max, item) => (item.value > max.value ? item : max), items[0]!);
}

function getLowestItem(items: ChartItem[]): ChartItem | null {
  if (!items.length) return null;
  return items.reduce((min, item) => (item.value < min.value ? item : min), items[0]!);
}

function InsightChartCard({
  title,
  subtitle,
  items,
  type,
}: {
  title: string;
  subtitle: string;
  items: ChartItem[];
  type: "gap" | "resource";
}) {
  const emphasisItem = type === "gap" ? getHighestItem(items) : getLowestItem(items);
  return (
    <div className="bg-white ring-1 ring-slate-200 rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="text-[15px] font-bold text-[#0f172a] mb-0.5">{title}</div>
      <div className="text-[12.5px] text-slate-400 mb-4">{subtitle}</div>
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const isEmphasis = emphasisItem?.label === item.label;
          const fillColor = type === "gap" ? "bg-amber-500" : "bg-slate-400";
          return (
            <div key={item.label} className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span
                  className={`text-[13px] font-semibold ${
                    isEmphasis ? "text-slate-900" : "text-slate-600"
                  }`}
                >
                  {item.label}
                </span>
                <span className="text-[12px] text-slate-400 tabular-nums">
                  ٪{item.value}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${fillColor} ${
                    isEmphasis ? "opacity-100" : "opacity-70"
                  }`}
                  style={{ width: `${Math.max(item.value, 4)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HowToReadToggle() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-[11.5px] text-slate-400 hover:text-slate-500 transition-colors cursor-pointer bg-transparent border-none p-0 select-none"
      >
        چگونه این را بخوانیم <span className="text-[9px]">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <p className="m-0 mt-1.5 text-[11.5px] leading-[1.8] text-slate-400">
          درصد شکاف = نشان می‌دهد یک نیاز در حال حاضر چقدر برآورده‌نشده است (بیشتر = ناترازی بزرگ‌تر).
          درصد منابع = نشان می‌دهد آن حوزه‌ی حمایتی اکنون چقدر در دسترس حس می‌شود (کمتر = ضعیف‌تر).
        </p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl ring-1 ring-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-6 sm:p-7 mb-5">
      <h2 className="text-[19px] leading-tight text-[#0f172a] font-bold tracking-[-0.01em] m-0 mb-4">
        {title}
      </h2>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function CompactCard({ title, text }: { title: string; text: string }) {
  if (!text || !text.trim()) return null;
  return (
    <div className="bg-slate-50 ring-1 ring-slate-100 rounded-xl p-3.5">
      <div className="text-[10.5px] font-bold tracking-[0.04em] text-slate-400 mb-1">
        {title}
      </div>
      <div className="text-[14px] leading-[1.8] text-slate-700">{text}</div>
    </div>
  );
}

function Quote({ children }: { children: React.ReactNode }) {
  if (!children || (typeof children === "string" && !children.trim())) return null;
  return (
    <div className="relative bg-slate-50 ring-1 ring-slate-200 border-r-2 border-blue-400 rounded-l-xl px-5 py-4 pr-12">
      <span
        aria-hidden="true"
        className="absolute top-1 right-3.5 text-[52px] leading-none font-serif text-slate-300 opacity-30 select-none pointer-events-none"
      >
        ”
      </span>
      <div className="text-[16px] leading-[1.9] text-slate-700">{children}</div>
    </div>
  );
}

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f5f7]">
      <div className="flex items-center gap-3 text-slate-500">
        <div className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-slate-700 animate-spin" />
        <span className="text-sm">در حال بارگذاری نتیجه…</span>
      </div>
    </div>
  );
}

function ErrorView({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f5f7] px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-8 text-center">
        <h1 className="text-lg font-semibold text-slate-900 mb-2">
          نتیجه‌ی شما بارگذاری نشد
        </h1>
        <p className="text-sm text-slate-600">{message}</p>
      </div>
    </div>
  );
}

function RecommendationCard({
  num,
  title,
  target,
  why,
  how,
  timeFrame,
  difficulty,
}: {
  num: number;
  title: string;
  target?: string;
  why?: string;
  how?: string;
  timeFrame?: string;
  difficulty?: string;
}) {
  if (!title) return null;
  return (
    <div className="bg-white ring-1 ring-slate-200 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col gap-2.5">
      <div className="flex items-start gap-2.5">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold flex items-center justify-center mt-0.5">
          {num}
        </span>
        <div>
          <div className="text-[15px] font-bold text-slate-900 leading-snug">{title}</div>
          {target && (
            <div className="text-[12px] text-blue-600 font-semibold mt-0.5">{target}</div>
          )}
        </div>
      </div>
      {why && (
        <div>
          <div className="text-[10.5px] font-bold tracking-[0.04em] text-slate-400 mb-0.5">
            چرا
          </div>
          <div className="text-[13.5px] leading-[1.8] text-slate-600">{why}</div>
        </div>
      )}
      {how && (
        <div>
          <div className="text-[10.5px] font-bold tracking-[0.04em] text-slate-400 mb-0.5">
            چگونه
          </div>
          <div className="text-[13.5px] leading-[1.8] text-slate-600">{how}</div>
        </div>
      )}
      {(timeFrame || difficulty) && (
        <div className="flex gap-1.5 flex-wrap pt-0.5">
          {timeFrame && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
              {timeFrame}
            </span>
          )}
          {difficulty && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-600">
              {difficulty}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function Pill({
  label,
  value,
  accent,
  subtle,
}: {
  label: string;
  value: string;
  accent?: boolean;
  subtle?: boolean;
}) {
  if (!value || !value.trim()) return null;
  return (
    <div
      className={`inline-flex flex-col rounded-xl px-3.5 py-2 ${
        accent
          ? "bg-[#e0f2fe] ring-1 ring-[#bae6fd]"
          : subtle
            ? "bg-slate-50 ring-1 ring-slate-200"
            : "bg-slate-100 ring-1 ring-slate-200"
      }`}
    >
      <span
        className={`text-[9.5px] font-bold tracking-[0.04em] mb-0.5 ${
          accent ? "text-[#0369a1]" : "text-slate-400"
        }`}
      >
        {label}
      </span>
      <span
        className={`text-[13px] font-semibold ${
          accent ? "text-[#0369a1]" : subtle ? "text-slate-500" : "text-slate-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function ResultsPage({ rid }: { rid: string | null }) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!rid) {
        setLoading(false);
        setError(
          "شناسه‌ی نتیجه‌ای ارائه نشده است. برای دیدن گزارش، ?rid=شناسه را به آدرس اضافه کنید."
        );
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/results/${rid}`);
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as ApiError | null;
          throw new Error(
            body?.error ??
              (res.status === 404 ? "نتیجه پیدا نشد." : "مشکلی پیش آمد.")
          );
        }
        const json = (await res.json()) as ApiResponse;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "خطای ناشناخته");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [rid]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("لینک نتیجه‌ی خود را کپی کنید:", url);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorView message={error} />;
  if (!data) return <ErrorView message="داده‌ای در دسترس نیست." />;

  const f = data.fields;
  const get = (key: string) => asString(f[key]);

  const primary = get("primary_pattern");
  const secondary = get("secondary_pattern");
  const showSecondary =
    secondary && secondary.toUpperCase() !== "NONE" && secondary.trim() !== "";
  const need = get("need") || get("main_need");
  const needFormatted = formatNeed(need);

  const aiSummary = get("ai_summary");
  const aiMechanism = get("ai_mechanism");
  const aiWhyItMatters = get("ai_why_it_matters");
  const aiMainNeedExplanation = get("ai_main_need_explanation");
  const aiResourceInterpretation = get("ai_resource_interpretation");
  const aiFirstStep = get("ai_first_step");
  const aiReflection = get("ai_reflection");
  const aiConfidence = get("ai_confidence");
  const aiWeakestResource = get("ai_weakest_resource");
  const aiInterventionSummary = get("ai_intervention_summary");

  const roleContext = get("role_context");
  const pressureSourcesRaw = get("pressure_sources");
  const pressureSources = isSafePressureSource(pressureSourcesRaw)
    ? pressureSourcesRaw
    : "";
  const improvementGoal = get("improvement_goal");
  const rechargeScore = get("recharge_score");
  const rechargeLevelText = get("recharge_level_text");
  const ageGroup = get("age_group");

  const aiRec1Title = get("ai_rec_1_title");
  const aiRec1Target = get("ai_rec_1_target");
  const aiRec1Why = get("ai_rec_1_why");
  const aiRec1How = get("ai_rec_1_how");
  const aiRec1TimeFrame = get("ai_rec_1_time_frame");
  const aiRec1Difficulty = get("ai_rec_1_difficulty");

  const aiRec2Title = get("ai_rec_2_title");
  const aiRec2Target = get("ai_rec_2_target");
  const aiRec2Why = get("ai_rec_2_why");
  const aiRec2How = get("ai_rec_2_how");
  const aiRec2TimeFrame = get("ai_rec_2_time_frame");
  const aiRec2Difficulty = get("ai_rec_2_difficulty");

  const aiRec3Title = get("ai_rec_3_title");
  const aiRec3Target = get("ai_rec_3_target");
  const aiRec3Why = get("ai_rec_3_why");
  const aiRec3How = get("ai_rec_3_how");
  const aiRec3TimeFrame = get("ai_rec_3_time_frame");
  const aiRec3Difficulty = get("ai_rec_3_difficulty");

  const summaryText = firstNonEmpty(aiSummary, get("driver_1"));
  const keyInsightText = firstNonEmpty(
    aiWhyItMatters,
    aiMechanism,
    defaultKeyInsight(primary)
  );

  const gaps = buildNeedGapItems(get);
  const resources = buildResourceItems(get);
  const hasGapData =
    gaps.some((g) => g.value > 0) || resources.some((r) => r.value > 0);

  const loopSteps = getStressLoop(primary);

  const rechargeDisplay = rechargeScore
    ? `${rechargeScore}/۵${rechargeLevelText ? ` · ${rechargeLevelText}` : ""}`
    : rechargeLevelText || "";

  const hasContext =
    roleContext || pressureSources || improvementGoal || rechargeDisplay;

  const hasAiRecs = !!(aiRec1Title || aiRec2Title || aiRec3Title);
  const hasFallbackRecs = !!(get("action_1") || get("action_2") || get("action_3"));

  const safeReflection = (() => {
    if (aiReflection && aiReflection.trim()) return aiReflection;
    if (get("reflection") && get("reflection").trim()) return get("reflection");
    return "کجا بیش از آنچه دریافت می‌کنید می‌بخشید؟ و چه چیزی می‌تواند این را متقابل‌تر، دیده‌شده‌تر یا پایدارتر کند؟";
  })();

  const needExplanationShort = truncateToTwoSentences(aiMainNeedExplanation);
  const resourceInterpretationShort = truncateToTwoSentences(
    aiResourceInterpretation
  );

  const firstResilienceLever = firstNonEmpty(
    truncateToTwoSentences(aiInterventionSummary),
    truncateToTwoSentences(aiResourceInterpretation)
  );

  const showSignalsSection =
    get("cog_attention") ||
    get("cog_decision") ||
    get("cog_regulation") ||
    get("body") ||
    get("emotions") ||
    get("behavior");

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-slate-900 py-10 px-4 sm:py-12">
      <div className="max-w-[860px] mx-auto">
        <div className="print-only print-header">
          نتیجه‌ی ارزیابی استرس · {formatReportDate(get("created_at"))}
        </div>

        {/* ── Hero ── */}
        <section className="bg-white ring-1 ring-slate-200 rounded-2xl p-6 sm:p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)] mb-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="text-[10.5px] font-bold tracking-[0.06em] text-slate-400">
              ارزیابی استرس و تاب‌آوری
            </div>
            <div className="no-print flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center rounded-full bg-white ring-1 ring-slate-300 text-slate-700 text-xs font-medium px-3.5 py-1.5 hover:bg-slate-50 transition-colors"
              >
                {copied ? "لینک کپی شد" : "اشتراک‌گذاری"}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center rounded-full bg-slate-900 text-white text-xs font-medium px-3.5 py-1.5 hover:bg-slate-700 transition-colors"
              >
                ذخیره به‌صورت PDF
              </button>
            </div>
          </div>

          <h1 className="text-[clamp(28px,5vw,46px)] leading-[1.07] m-0 mb-2.5 text-[#0f172a] font-bold tracking-[-0.02em]">
            {formatPattern(primary)}
          </h1>

          <p className="text-[16.5px] leading-[1.6] text-[#334155] font-semibold max-w-[680px] m-0 mb-3">
            {patternAnchor(primary)}
          </p>

          {summaryText && (
            <p className="text-[15px] leading-[1.9] text-slate-600 max-w-[680px] m-0 mb-5">
              {summaryText}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Pill label="الگو" value={formatPattern(primary)} accent />
            {showSecondary && (
              <Pill label="الگوی ثانویه" value={formatPattern(secondary)} />
            )}
            {needFormatted && !isNoMajorNeed(needFormatted) && (
              <Pill label="نیاز اصلی" value={needFormatted} />
            )}
            {isNoMajorNeed(needFormatted) && (
              <Pill label="کانون توجه" value="حفظ و محافظت از منابع" />
            )}
            {aiConfidence && <Pill label="اطمینان" value={aiConfidence} subtle />}
            {aiWeakestResource && (
              <Pill label="ضعیف‌ترین منبع" value={aiWeakestResource} subtle />
            )}
          </div>

          {/* Inline context strip */}
          {hasContext && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-x-5 gap-y-2">
              {roleContext && (
                <span className="text-[13px] text-slate-500">
                  <span className="font-semibold text-slate-700">نقش:</span>{" "}
                  {roleContext}
                </span>
              )}
              {pressureSources && (
                <span className="text-[13px] text-slate-500">
                  <span className="font-semibold text-slate-700">منبع فشار:</span>{" "}
                  {pressureSources}
                </span>
              )}
              {improvementGoal && (
                <span className="text-[13px] text-slate-500">
                  <span className="font-semibold text-slate-700">هدف:</span>{" "}
                  {improvementGoal}
                </span>
              )}
              {rechargeDisplay && (
                <span className="text-[13px] text-slate-500">
                  <span className="font-semibold text-slate-700">شارژ مجدد:</span>{" "}
                  {rechargeDisplay}
                </span>
              )}
              {ageGroup && (
                <span className="text-[12px] text-slate-400">{ageGroup}</span>
              )}
            </div>
          )}
        </section>

        {/* ── Key Insight ── */}
        {keyInsightText && (
          <div className="bg-[#0f172a] rounded-2xl p-5 sm:p-6 mb-5 ring-1 ring-slate-800">
            <div className="text-[10px] font-bold tracking-[0.06em] text-slate-400 mb-2">
              نکته‌ی کلیدی
            </div>
            <p className="text-[16.5px] leading-[1.9] text-white font-medium m-0">
              {keyInsightText}
            </p>
          </div>
        )}

        {/* ── Your Stress Loop ── */}
        <Section title="چرخه‌ی استرس شما">
          <p className="text-[13px] leading-[1.7] text-slate-400 -mt-1">
            این الگو احتمالاً چگونه خود را پیش می‌برد و پایدار نگه می‌دارد.
          </p>
          <div className="flex flex-col gap-0 mt-1">
            {loopSteps.map((s, i) => (
              <div key={s.step} className="flex gap-3 items-stretch">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-[12px] font-bold flex items-center justify-center flex-shrink-0">
                    {s.step}
                  </div>
                  {i < loopSteps.length - 1 && (
                    <div className="w-px bg-slate-200 flex-1 my-1" />
                  )}
                </div>
                <div className={`pb-${i < loopSteps.length - 1 ? "3" : "0"} pt-1`}>
                  <div className="text-[14.5px] leading-[1.7] text-slate-700 font-medium">
                    {s.text}
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-3 mr-9 flex items-center gap-2">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                ↩ چرخه ادامه می‌یابد
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
          </div>
        </Section>

        {/* ── Stress & Resilience Map ── */}
        {hasGapData && (
          <Section title="نقشه‌ی استرس و تاب‌آوری">
            <div className="bg-slate-50 ring-1 ring-slate-100 rounded-xl p-4 grid gap-2">
              {needFormatted && !isNoMajorNeed(needFormatted) && (
                <div className="flex gap-3 items-start">
                  <span className="text-[10.5px] font-bold tracking-[0.04em] text-slate-400 pt-0.5 w-36 flex-shrink-0">
                    ناترازی اصلی
                  </span>
                  <span className="text-[13.5px] text-slate-700 font-medium">
                    {needFormatted}
                  </span>
                </div>
              )}
              {isNoMajorNeed(needFormatted) && (
                <div className="flex gap-3 items-start">
                  <span className="text-[10.5px] font-bold tracking-[0.04em] text-slate-400 pt-0.5 w-36 flex-shrink-0">
                    کانون توجه
                  </span>
                  <span className="text-[13.5px] text-slate-700 font-medium">
                    حفظ و محافظت از منابع
                  </span>
                </div>
              )}
              {aiWeakestResource && (
                <div className="flex gap-3 items-start">
                  <span className="text-[10.5px] font-bold tracking-[0.04em] text-slate-400 pt-0.5 w-36 flex-shrink-0">
                    آسیب‌پذیرترین بخش
                  </span>
                  <span className="text-[13.5px] text-slate-700 font-medium">
                    {aiWeakestResource}
                  </span>
                </div>
              )}
              {firstResilienceLever && (
                <div className="flex gap-3 items-start">
                  <span className="text-[10.5px] font-bold tracking-[0.04em] text-slate-400 pt-0.5 w-36 flex-shrink-0">
                    نخستین اهرم
                  </span>
                  <span className="text-[13.5px] text-slate-600">
                    {firstResilienceLever}
                  </span>
                </div>
              )}
            </div>

            <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
              <InsightChartCard
                title="شکاف نیازها"
                subtitle="بیشتر = برآورده‌نشده‌تر"
                items={gaps}
                type="gap"
              />
              <InsightChartCard
                title="منابع"
                subtitle="کمتر = در حال حاضر کم‌دسترس‌تر"
                items={resources}
                type="resource"
              />
            </div>

            {needExplanationShort && (
              <p className="text-[13.5px] leading-[1.85] text-slate-600 m-0">
                {needExplanationShort}
              </p>
            )}
            {resourceInterpretationShort &&
              needExplanationShort !== resourceInterpretationShort && (
                <p className="text-[13.5px] leading-[1.85] text-slate-600 m-0">
                  {resourceInterpretationShort}
                </p>
              )}

            <div className="flex items-start gap-2 text-[12px] text-amber-700 bg-amber-50 ring-1 ring-amber-100 rounded-lg px-3.5 py-2.5">
              <span className="font-semibold flex-shrink-0">توجه:</span>
              <span>
                شکاف کم در نیازها به‌معنای نبودِ استرس نیست. استرس می‌تواند از فشار، ارزیابی ذهنی، بازیابی یا کاهش منابع هم بیاید.
              </span>
            </div>
            <HowToReadToggle />
          </Section>
        )}

        {/* ── How This May Show Up ── */}
        {showSignalsSection && (
          <Section title="این الگو چگونه ممکن است بروز کند">
            <div className="grid gap-2.5 grid-cols-[repeat(auto-fit,minmax(190px,1fr))]">
              <CompactCard title="توجه و تمرکز" text={get("cog_attention")} />
              <CompactCard title="تفکر و تصمیم‌گیری" text={get("cog_decision")} />
              <CompactCard title="خودتنظیمی" text={get("cog_regulation")} />
              <CompactCard title="بدن" text={get("body")} />
              <CompactCard title="هیجان‌ها" text={get("emotions")} />
              <CompactCard title="رفتار" text={get("behavior")} />
            </div>
          </Section>
        )}

        {/* ── 7-Day Resilience Plan ── */}
        {(hasAiRecs || hasFallbackRecs) && (
          <Section title="برنامه‌ی ۷ روزه‌ی تاب‌آوری شما">
            <div className="bg-[#fef3c7] ring-1 ring-[#fde68a] rounded-xl p-4 -mt-1">
              <div className="text-[10.5px] font-bold tracking-[0.04em] text-[#92400e] mb-1">
                از اینجا شروع کنید
              </div>
              <div className="text-[14.5px] leading-[1.8] text-[#92400e] font-medium">
                {firstNonEmpty(aiFirstStep, startHereText(primary))}
              </div>
            </div>
            {hasAiRecs ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <RecommendationCard
                  num={1}
                  title={aiRec1Title}
                  target={aiRec1Target}
                  why={aiRec1Why}
                  how={aiRec1How}
                  timeFrame={aiRec1TimeFrame}
                  difficulty={aiRec1Difficulty}
                />
                <RecommendationCard
                  num={2}
                  title={aiRec2Title}
                  target={aiRec2Target}
                  why={aiRec2Why}
                  how={aiRec2How}
                  timeFrame={aiRec2TimeFrame}
                  difficulty={aiRec2Difficulty}
                />
                <RecommendationCard
                  num={3}
                  title={aiRec3Title}
                  target={aiRec3Target}
                  why={aiRec3Why}
                  how={aiRec3How}
                  timeFrame={aiRec3TimeFrame}
                  difficulty={aiRec3Difficulty}
                />
              </div>
            ) : (
              <div className="grid gap-2.5">
                {[get("action_1"), get("action_2"), get("action_3")]
                  .filter(Boolean)
                  .map((a, i) => (
                    <div
                      key={i}
                      className="flex gap-3 bg-slate-50 ring-1 ring-slate-100 rounded-xl p-3.5"
                    >
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[11px] font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <div className="text-[14px] leading-[1.8] text-slate-700">{a}</div>
                    </div>
                  ))}
              </div>
            )}
          </Section>
        )}

        {/* ── Reflection ── */}
        <Section title="یک پرسش برای تأمل">
          <Quote>{safeReflection}</Quote>
        </Section>

        {/* ── About This Report ── */}
        <div className="text-center px-4 pb-2 mb-2">
          <p className="text-[12.5px] leading-[1.8] text-slate-400 max-w-[600px] mx-auto">
            این یک تفسیر غیرکلینیکی از استرس و تاب‌آوری است، نه یک تشخیص. اگر استرس
            غیرقابل‌مدیریت به‌نظر می‌رسد یا به‌شدت بر زندگی روزمره اثر می‌گذارد، با یک
            متخصص واجد شرایط یا یک منبع حمایتی مورد اعتماد صحبت کنید.
          </p>
          {get("result_id") && (
            <p className="text-[11px] text-slate-300 mt-1">
              شناسه‌ی نتیجه {get("result_id")}
            </p>
          )}
          <p className="text-[11px] text-slate-300 mt-0.5">
            {formatReportDate(get("created_at"))}
          </p>
        </div>

        <div className="print-only print-disclaimer">
          <div className="print-disclaimer-title">درباره‌ی این گزارش</div>
          <p>
            این یک تفسیر غیرکلینیکی از استرس و تاب‌آوری است، نه یک تشخیص. این گزارش
            تنها برای تأمل شخصی در نظر گرفته شده و جایگزین ارزیابی تخصصی نیست.
          </p>
        </div>
      </div>
    </div>
  );
}
