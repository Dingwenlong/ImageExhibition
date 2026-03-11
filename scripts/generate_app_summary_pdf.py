from __future__ import annotations

from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Frame, Paragraph, Spacer


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "output" / "pdf" / "imageexhibition-app-summary.pdf"

FONT_NAME = "STSong-Light"
PAGE_WIDTH, PAGE_HEIGHT = A4
PAGE_MARGIN = 18 * mm
HEADER_HEIGHT = 36 * mm
COLUMN_GAP = 8 * mm
COLUMN_WIDTH = (PAGE_WIDTH - (PAGE_MARGIN * 2) - COLUMN_GAP) / 2
BODY_TOP = PAGE_HEIGHT - PAGE_MARGIN - HEADER_HEIGHT
BODY_BOTTOM = PAGE_MARGIN
BODY_HEIGHT = BODY_TOP - BODY_BOTTOM

TITLE_COLOR = HexColor("#1F3C88")
ACCENT_COLOR = HexColor("#3D6CB9")
TEXT_COLOR = HexColor("#102A43")
MUTED_COLOR = HexColor("#5C6B7A")
HEADER_BG = HexColor("#EAF2FF")


def latin(text: str, bold: bool = False) -> str:
    font_name = "Helvetica-Bold" if bold else "Helvetica"
    return f'<font name="{font_name}">{escape(text)}</font>'


CONTENT = {
    "what_it_is": (
        f"{latin('ImageExhibition')} 是一个纯前端摄影作品展示应用，包含公开展示页和本地管理后台。"
        f"页面内容由仓库内的 {latin('JSON')} 数据文件和本地图片资源驱动；{latin('README')} 中未发现构建工具、后端服务或数据库依赖。"
    ),
    "who_its_for": (
        "适合需要维护个人作品集的摄影师/站点维护者，也适合浏览作品的潜在客户或访客。"
    ),
    "what_it_does": [
        "展示首页首屏、作品集、关于与联系等公开页面内容。",
        "按人像、风光、纪实、黑白四类筛选作品。",
        "通过灯箱查看大图、元数据，并支持切换、分享、滑动与缩放。",
        f"从 {latin('data/config.json')} 应用品牌文案、按钮和主题配置，并支持亮/暗主题切换。",
        "在本地管理后台编辑首页配置、主题配置和作品条目。",
        f"导入或导出 {latin('config.json / photos.json')}，再手动替换 {latin('data/')} 下文件同步首页。",
        "提供联系表单的前端校验与模拟提交。",
    ],
    "how_it_works": [
        f"{latin('index.html + js/main.js')}：浏览器加载公开站点，读取 {latin('data/config.json')} 与 {latin('data/photos.json')}，渲染首屏、画廊、灯箱和表单交互。",
        f"{latin('admin.html + js/admin.js')}：本地访问时读取同一组 {latin('JSON')}，在浏览器内存中编辑，并通过 {latin('FileReader')} 导入、{latin('Blob')} 下载导出。",
        f"浏览器本地状态：{latin('localStorage')} 保存主题偏好和最近浏览记录。",
        f"{latin('scripts/download_unsplash_images.py')}：使用 {latin('Pillow')} 生成 {latin('JPG / WebP')} / 模糊缩略图，并更新 {latin('data/photos.json')} 与 {latin('images/ATTRIBUTION.md')}。",
        f"后端/API/数据库：{latin('Not found in repo.')}",
        "联系表单消息发送服务：Not found in repo.",
    ],
    "how_to_run": [
        f"在仓库根目录运行：{latin('python -m http.server 8000')}",
        f"打开首页：{latin('http://127.0.0.1:8000/index.html')}",
        f"打开后台：{latin('http://127.0.0.1:8000/admin.html')}",
    ],
}


def register_fonts() -> None:
    pdfmetrics.registerFont(UnicodeCIDFont(FONT_NAME))


def build_styles() -> dict[str, ParagraphStyle]:
    base = {
        "fontName": FONT_NAME,
        "textColor": TEXT_COLOR,
        "alignment": TA_LEFT,
        "wordWrap": "CJK",
    }
    section_base = {**base, "textColor": ACCENT_COLOR}
    return {
        "section_title": ParagraphStyle(
            "section_title",
            **section_base,
            fontSize=13.5,
            leading=16,
            spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "body",
            **base,
            fontSize=10.7,
            leading=14,
            spaceAfter=5,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            **base,
            fontSize=10.5,
            leading=13.4,
            leftIndent=9,
            firstLineIndent=-9,
            spaceAfter=2.5,
        ),
    }


def draw_header(pdf: canvas.Canvas) -> None:
    header_y = PAGE_HEIGHT - PAGE_MARGIN - HEADER_HEIGHT
    pdf.setFillColor(HEADER_BG)
    pdf.roundRect(PAGE_MARGIN, header_y, PAGE_WIDTH - (PAGE_MARGIN * 2), HEADER_HEIGHT - 4 * mm, 6 * mm, fill=1, stroke=0)

    pdf.setFillColor(TITLE_COLOR)
    title_x = PAGE_MARGIN + 8 * mm
    title_y = PAGE_HEIGHT - PAGE_MARGIN - 12 * mm
    pdf.setFont("Helvetica-Bold", 19.5)
    pdf.drawString(title_x, title_y, "ImageExhibition")
    title_x += pdf.stringWidth("ImageExhibition", "Helvetica-Bold", 19.5) + 5
    pdf.setFont(FONT_NAME, 22)
    pdf.drawString(title_x, title_y, "应用概览")

    pdf.setFillColor(MUTED_COLOR)
    pdf.setFont(FONT_NAME, 10.5)
    pdf.drawString(PAGE_MARGIN + 8 * mm, PAGE_HEIGHT - PAGE_MARGIN - 19 * mm, "基于仓库实现证据整理的单页摘要")

    pdf.setFillColor(ACCENT_COLOR)
    pdf.roundRect(PAGE_MARGIN + 8 * mm, PAGE_HEIGHT - PAGE_MARGIN - 27.5 * mm, 34 * mm, 7 * mm, 2.5 * mm, fill=1, stroke=0)
    pdf.setFillColor(white)
    pdf.setFont("Helvetica-Bold", 9.5)
    pdf.drawCentredString(PAGE_MARGIN + 25 * mm, PAGE_HEIGHT - PAGE_MARGIN - 22.7 * mm, "Static Frontend App")


def section(title: str, styles: dict[str, ParagraphStyle], body: str | None = None, bullets: list[str] | None = None) -> list:
    story = [Paragraph(title, styles["section_title"])]
    if body:
        story.append(Paragraph(body, styles["body"]))
    if bullets:
        for item in bullets:
            story.append(Paragraph(f"- {item}", styles["bullet"]))
    story.append(Spacer(1, 5))
    return story


def build_columns(styles: dict[str, ParagraphStyle]) -> tuple[list, list]:
    who_title = latin("Who it's for", bold=True)
    left_story = []
    left_story.extend(section(f"{latin('What it is', bold=True)} / 是什么", styles, body=CONTENT["what_it_is"]))
    left_story.extend(section(f"{who_title} / 面向谁", styles, body=CONTENT["who_its_for"]))
    left_story.extend(section(f"{latin('What it does', bold=True)} / 主要功能", styles, bullets=CONTENT["what_it_does"]))

    right_story = []
    right_story.extend(section(f"{latin('How it works', bold=True)} / 工作原理", styles, bullets=CONTENT["how_it_works"]))
    right_story.extend(section(f"{latin('How to run', bold=True)} / 如何运行", styles, bullets=CONTENT["how_to_run"]))
    return left_story, right_story


def render_single_page(output_path: Path) -> None:
    register_fonts()
    styles = build_styles()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    pdf = canvas.Canvas(str(output_path), pagesize=A4)
    pdf.setTitle("ImageExhibition App Summary")
    pdf.setAuthor("OpenAI Codex")
    pdf.setSubject("Single-page repository-backed app summary")

    draw_header(pdf)

    left_frame = Frame(
        PAGE_MARGIN,
        BODY_BOTTOM,
        COLUMN_WIDTH,
        BODY_HEIGHT,
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
        showBoundary=0,
    )
    right_frame = Frame(
        PAGE_MARGIN + COLUMN_WIDTH + COLUMN_GAP,
        BODY_BOTTOM,
        COLUMN_WIDTH,
        BODY_HEIGHT,
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
        showBoundary=0,
    )

    left_story, right_story = build_columns(styles)
    left_frame.addFromList(left_story, pdf)
    right_frame.addFromList(right_story, pdf)

    if left_story or right_story:
        raise RuntimeError("PDF content overflowed the single-page layout.")

    pdf.save()


def main() -> None:
    render_single_page(OUTPUT_PATH)
    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()
