/**
 * 資格ロードマップ: 原本コピー + 人事向け2枚目を追加
 *   node scripts/build-qualification-roadmap-hr-deck.mjs
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const py = `import os, re, shutil
from copy import deepcopy
from datetime import date
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor

BASE = r"C:\\\\tmp"
SRC_NAME = None
for name in os.listdir(BASE):
    if "資格" in name or "ロードマップ" in name:
        folder = os.path.join(BASE, name)
        for f in os.listdir(folder):
            if f.endswith(".pptx") and not f.startswith("~") and "人事" not in f:
                SRC_NAME = os.path.join(folder, f)
                OUT_DIR = folder
                break
    if SRC_NAME:
        break

if not SRC_NAME:
    raise SystemExit("原本 pptx が見つかりません")

OUT_PATH = os.path.join(
    OUT_DIR,
    "システム推進室_資格取得ロードマップ_人事説明付き.pptx",
)

prs = Presentation(SRC_NAME)
# 軽微な表記統一（1枚目）
for slide in prs.slides:
    for shape in slide.shapes:
        if not shape.has_text_frame:
            continue
        for para in shape.text_frame.paragraphs:
            for run in para.runs:
                t = run.text
                if not t:
                    continue
                t2 = (
                    t.replace("出来る", "できる")
                    .replace("推奨教材：: ", "推奨教材：")
                    .replace("推奨教材：:", "推奨教材：")
                    .replace("サーバ構築する上", "サーバ構築をする上")
                )
                if t2 != t:
                    run.text = t2

# --- 2枚目: 人事説明 ---
blank = prs.slide_layouts[6] if len(prs.slide_layouts) > 6 else prs.slide_layouts[-1]
slide2 = prs.slides.add_slide(blank)

MARGIN_L = Inches(0.45)
MARGIN_T = Inches(0.35)
CONTENT_W = Inches(12.4)

def add_box(top, height, text, font_pt=14, bold=False, color=None):
    box = slide2.shapes.add_textbox(MARGIN_L, top, CONTENT_W, height)
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(font_pt)
    p.font.bold = bold
    p.font.name = "Yu Gothic UI"
    if color:
        p.font.color.rgb = color
    return box

y = MARGIN_T
add_box(y, Inches(0.55), "システム推進室　資格取得ロードマップ（人事向け説明）", 22, True, RGBColor(0x0F, 0x17, 0x2A))
y += Inches(0.62)
add_box(
    y,
    Inches(0.45),
    f"資料区分：未経験者（新卒・第二新卒等）向けの取得指針　｜　版：{date.today().isoformat()}　｜　1枚目＝ロードマップ本体",
    11,
    False,
    RGBColor(0x47, 0x55, 0x69),
)
y += Inches(0.52)

sections = [
    (
        "1. 本資料の位置づけ",
        "・1枚目は「いつまでにどの資格を目指すか」のロードマップ（望ましい取得時期の指針）。\\n"
        "・国家試験中心。全員が同じ時期に全資格を取得する必要はない（業務配属・個人の学習ペースを考慮）。\\n"
        "・中途入社・経験者は、保有資格に応じてロードマップ上の「段階」から開始（入社年目は参考）。",
    ),
    (
        "2. 必須 / 推奨 / 任意（人事・上長が説明するときの目安）",
        "【推奨（キャリアの背骨）】1〜4年目：基本情報 →（並行可）SG → 応用情報\\n"
        "【業務連動で推奨】2年目：建設業経理士2級・第二種電気工事士（建設・設備・現場系案件に関わる人は特に有効）\\n"
        "【上級・選抜枠】5年目以降：NWスペシャリスト／ITストラテジスト／情報処理安全確保支援士（到達は個人の専門志向に応じて）",
    ),
    (
        "3. 年次ごとの取得目安（1枚目との対応）",
        "入社1年目（初級・基礎）：基本情報技術者、情報セキュリティマネジメント\\n"
        "入社2年目（初級・実務）：建設業経理士2級、第二種電気工事士\\n"
        "入社3〜4年目（中堅）：応用情報技術者（基本情報合格後が前提）\\n"
        "入社5〜8年目（中級）：ネットワークスペシャリスト\\n"
        "入社9年目〜（上級）：ITストラテジスト、情報処理安全確保支援士",
    ),
    (
        "4. 学習負荷の現実（面談・配属時に共有）",
        "・1年目の基本情報（目安約200時間）＋SG（約100時間）を同時に求めすぎない。原則「基本情報を先に」、SGは2年目までにでも可。\\n"
        "・応用情報（約500時間）、NW（約600時間）は本業と並行の長期戦。試験日程に合わせた学習計画の相談を推奨。",
    ),
    (
        "5. 合格率・制度変更",
        "・1枚目の合格率はIPA公表値を参考に記載（試験回・年度により変動。最新はIPA公式サイトで確認）。\\n"
        "・2027年度以降、高度試験は「プロフェッショナルデジタルスキル試験（仮称）」へ再編予定。詳細は制度発表後にロードマップを更新。",
    ),
    (
        "6. 人事・推進室での運用（記入・調整してください）",
        "□ 受験費用の会社負担範囲：＿＿＿＿＿＿＿＿＿＿\\n"
        "□ 勉強時間・研修との位置づけ：＿＿＿＿＿＿＿＿＿＿\\n"
        "□ 取得報告・人事登録の窓口：＿＿＿＿＿＿＿＿＿＿\\n"
        "□ ベンダ資格（AWS/Azure等）の扱い：本ロードマップ外／別枠で管理　など",
    ),
]

for title, body in sections:
    add_box(y, Inches(0.32), title, 13, True, RGBColor(0x1E, 0x40, 0xAF))
    y += Inches(0.34)
    box = add_box(y, Inches(0.72), "", 11)
    tf = box.text_frame
    tf.clear()
    for line in body.split("\\\\n"):
        p = tf.add_paragraph() if tf.text else tf.paragraphs[0]
        if tf.text and line:
            p = tf.add_paragraph()
        p.text = line
        p.font.size = Pt(11)
        p.font.name = "Yu Gothic UI"
        p.space_after = Pt(2)
        p.level = 0
    y += Inches(0.78)

add_box(
    y,
    Inches(0.4),
    "※ 本スライドは社内説明・面談用。対外配布時は1枚目のみ、または会社方針欄を確定してから配布してください。",
    10,
    False,
    RGBColor(0x64, 0x74, 0x8B),
)

prs.save(OUT_PATH)
print("OK:", OUT_PATH)
print("slides:", len(prs.slides))
`;

const scriptPath = path.join(process.cwd(), 'scripts', '_build_roadmap_hr_deck.py');
fs.writeFileSync(scriptPath, py.replace(/\\\\n/g, '\\n'), 'utf8');
const r = spawnSync('python', [scriptPath], { encoding: 'utf8' });
console.log(r.stdout || '');
if (r.stderr) console.error(r.stderr);
process.exit(r.status ?? 1);
