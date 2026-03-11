from __future__ import annotations

import json
import re
import string
import subprocess
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
IMAGES_DIR = ROOT / "images"
FULL_DIR = IMAGES_DIR / "full"
THUMB_DIR = IMAGES_DIR / "thumbs"
WEBP_FULL_DIR = IMAGES_DIR / "webp" / "full"
WEBP_THUMB_DIR = IMAGES_DIR / "webp" / "thumbs"
BLUR_DIR = IMAGES_DIR / "blur"
TMP_DIR = IMAGES_DIR / "_tmp"
PHOTOS_JSON = ROOT / "data" / "photos.json"
ATTRIBUTION_MD = IMAGES_DIR / "ATTRIBUTION.md"

THUMB_SIZE = (400, 300)
BLUR_SIZE = (40, 30)
DOWNLOAD_WIDTH = 1800


PHOTO_SPECS = [
    {
        "id": 1,
        "slug": "95UF6LXe-Lo",
        "title": "光线中的侧颜",
        "category": "portrait",
        "metadata": {
            "camera": "Canon EOS R6 Mark II",
            "lens": "RF 85mm F1.2L USM",
            "aperture": "f/1.8",
            "shutter": "1/320s",
            "iso": "200",
            "location": "北京工作室",
            "date": "2024-05-18",
            "description": "柔和侧光把人物从背景中轻轻提亮，画面情绪克制而安静。",
        },
    },
    {
        "id": 2,
        "slug": "4GSOe3Dl314",
        "title": "静默凝视",
        "category": "portrait",
        "metadata": {
            "camera": "Sony A7 IV",
            "lens": "FE 85mm F1.8",
            "aperture": "f/2.0",
            "shutter": "1/250s",
            "iso": "160",
            "location": "上海棚拍空间",
            "date": "2024-07-12",
            "description": "近距离的视线交流让肖像更直接，肤色与背景保持了干净的层次。",
        },
    },
    {
        "id": 3,
        "slug": "3egFJhKIThQ",
        "title": "风中的微笑",
        "category": "portrait",
        "metadata": {
            "camera": "Nikon Z6 II",
            "lens": "NIKKOR Z 50mm f/1.8 S",
            "aperture": "f/2.2",
            "shutter": "1/500s",
            "iso": "100",
            "location": "广州天台",
            "date": "2024-09-03",
            "description": "自然风带动发丝与表情，画面保留了轻松、不刻意的生活感。",
        },
    },
    {
        "id": 4,
        "slug": "twukN12EN7c",
        "title": "山间晨雾",
        "category": "landscape",
        "metadata": {
            "camera": "Sony A7R IV",
            "lens": "FE 16-35mm F2.8 GM",
            "aperture": "f/11",
            "shutter": "1/80s",
            "iso": "125",
            "location": "高地山谷",
            "date": "2023-10-08",
            "description": "层叠山体被清晨雾气轻轻包住，冷暖光线在远处形成柔和过渡。",
        },
    },
    {
        "id": 5,
        "slug": "WKuveRcVHgk",
        "title": "雪岭远眺",
        "category": "landscape",
        "metadata": {
            "camera": "Canon EOS R5",
            "lens": "RF 24-70mm F2.8L IS USM",
            "aperture": "f/10",
            "shutter": "1/160s",
            "iso": "100",
            "location": "冰川高地",
            "date": "2024-02-11",
            "description": "雪线与云层把空间拉得很开，画面重点落在山脊的节奏与尺度感上。",
        },
    },
    {
        "id": 6,
        "slug": "MA5QbLODNjs",
        "title": "夜色星幕",
        "category": "landscape",
        "metadata": {
            "camera": "Nikon Z7 II",
            "lens": "NIKKOR Z 14-24mm f/2.8 S",
            "aperture": "f/2.8",
            "shutter": "20s",
            "iso": "3200",
            "location": "荒野营地",
            "date": "2024-08-22",
            "description": "深夜的地平线很安静，星空与地面微弱光源一起撑起整张画面的氛围。",
        },
    },
    {
        "id": 7,
        "slug": "vrs9ciFsFSs",
        "title": "市井早集",
        "category": "documentary",
        "metadata": {
            "camera": "Fujifilm X-T5",
            "lens": "XF 35mm F1.4 R",
            "aperture": "f/4",
            "shutter": "1/200s",
            "iso": "500",
            "location": "老城区街市",
            "date": "2024-04-06",
            "description": "镜头停在普通人的工作节奏里，画面重点不是戏剧冲突，而是日常本身。",
        },
    },
    {
        "id": 8,
        "slug": "EPgwA6lB6pQ",
        "title": "街头穿行",
        "category": "documentary",
        "metadata": {
            "camera": "Leica Q3",
            "lens": "Summilux 28mm f/1.7 ASPH",
            "aperture": "f/5.6",
            "shutter": "1/320s",
            "iso": "400",
            "location": "城市街口",
            "date": "2024-06-27",
            "description": "人流在同一空间里短暂交汇，纪实感来自自然发生的动作与视线关系。",
        },
    },
    {
        "id": 9,
        "slug": "_CbCkypAV38",
        "title": "集市一角",
        "category": "documentary",
        "metadata": {
            "camera": "Ricoh GR IIIx",
            "lens": "40mm equivalent f/2.8",
            "aperture": "f/4.5",
            "shutter": "1/160s",
            "iso": "640",
            "location": "海边小镇",
            "date": "2023-12-01",
            "description": "稍带距离感的观察方式保留了环境信息，也让人物状态显得更自然。",
        },
    },
    {
        "id": 10,
        "slug": "QsDEa0qvk20",
        "title": "单色橱窗",
        "category": "blackwhite",
        "metadata": {
            "camera": "Leica Q2 Monochrom",
            "lens": "Summilux 28mm f/1.7 ASPH",
            "aperture": "f/4",
            "shutter": "1/250s",
            "iso": "400",
            "location": "城市街区",
            "date": "2024-01-09",
            "description": "黑白处理压缩了色彩干扰，光线、材质和人物边界因此更加醒目。",
        },
    },
    {
        "id": 11,
        "slug": "00d6_WvJfI4",
        "title": "建筑的线条",
        "category": "blackwhite",
        "metadata": {
            "camera": "Sony A7R V",
            "lens": "FE 24-70mm F2.8 GM II",
            "aperture": "f/8",
            "shutter": "1/500s",
            "iso": "125",
            "location": "商务区",
            "date": "2024-03-14",
            "description": "把建筑转换为黑白后，视线会更自然地落在线条、留白和重复结构上。",
        },
    },
    {
        "id": 12,
        "slug": "XmT-nd4RFjY",
        "title": "雨巷剪影",
        "category": "blackwhite",
        "metadata": {
            "camera": "Ricoh GR IIIx",
            "lens": "40mm equivalent f/2.8",
            "aperture": "f/5.6",
            "shutter": "1/160s",
            "iso": "800",
            "location": "街头夜雨",
            "date": "2024-11-02",
            "description": "反光地面与剪影人物构成了最简洁的层次，黑白影调让情绪更集中。",
        },
    },
]


def ensure_dirs() -> None:
    for path in [FULL_DIR, THUMB_DIR, WEBP_FULL_DIR, WEBP_THUMB_DIR, BLUR_DIR, TMP_DIR]:
        path.mkdir(parents=True, exist_ok=True)


def run_curl(*args: str) -> str:
    result = subprocess.run(
        ["curl.exe", "-sS", *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="ignore",
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "curl failed")
    return result.stdout


def unsplash_download_url(slug: str) -> str:
    return f"https://unsplash.com/photos/{slug}/download?force=true&w={DOWNLOAD_WIDTH}"


def unsplash_page_url(slug: str) -> str:
    return f"https://unsplash.com/photos/{slug}"


def format_author_name(author_slug: str) -> str:
    words = author_slug.replace("-", " ").split()
    return string.capwords(" ".join(words))


def fetch_author_name(slug: str) -> str:
    headers = run_curl("-I", "-L", "--max-time", "60", unsplash_download_url(slug))
    matches = re.findall(r'content-disposition:\s*attachment;filename="([^"]+)"', headers, flags=re.IGNORECASE)
    if not matches:
        return "Unsplash 摄影师"

    filename_stem = Path(matches[-1]).stem
    suffix = f"-{slug}-unsplash"
    if filename_stem.endswith(suffix):
        author_slug = filename_stem[: -len(suffix)]
    else:
        author_slug = filename_stem
    return format_author_name(author_slug) or "Unsplash 摄影师"


def download_original(slug: str, destination: Path) -> None:
    subprocess.run(
        [
            "curl.exe",
            "-sS",
            "-L",
            "--fail",
            "-A",
            "Mozilla/5.0",
            "-o",
            str(destination),
            unsplash_download_url(slug),
        ],
        check=True,
    )


def build_variants(source_path: Path, photo_id: int, category: str) -> dict[str, str]:
    full_name = f"photo-{photo_id:02d}.jpg"
    thumb_name = f"photo-{photo_id:02d}.jpg"
    blur_name = f"photo-{photo_id:02d}-blur.jpg"
    webp_full_name = f"photo-{photo_id:02d}.webp"
    webp_thumb_name = f"photo-{photo_id:02d}.webp"

    full_path = FULL_DIR / full_name
    thumb_path = THUMB_DIR / thumb_name
    blur_path = BLUR_DIR / blur_name
    webp_full_path = WEBP_FULL_DIR / webp_full_name
    webp_thumb_path = WEBP_THUMB_DIR / webp_thumb_name

    with Image.open(source_path) as image:
        base = ImageOps.exif_transpose(image).convert("RGB")
        if category == "blackwhite":
            base = ImageOps.grayscale(base).convert("RGB")

        base.save(full_path, "JPEG", quality=88, optimize=True, progressive=True)
        base.save(webp_full_path, "WEBP", quality=84, method=6)

        thumb = ImageOps.fit(base, THUMB_SIZE, method=Image.Resampling.LANCZOS)
        thumb.save(thumb_path, "JPEG", quality=86, optimize=True, progressive=True)
        thumb.save(webp_thumb_path, "WEBP", quality=82, method=6)

        blur = thumb.resize(BLUR_SIZE, Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(radius=2))
        blur.save(blur_path, "JPEG", quality=70, optimize=True)

    return {
        "thumbnail": f"images/thumbs/{thumb_name}",
        "fullImage": f"images/full/{full_name}",
        "webpThumbnail": f"images/webp/thumbs/{webp_thumb_name}",
        "webpFull": f"images/webp/full/{webp_full_name}",
        "blurThumbnail": f"images/blur/{blur_name}",
    }


def validate_outputs(photos: list[dict]) -> None:
    missing = []
    for photo in photos:
        for key in ["thumbnail", "fullImage", "webpThumbnail", "webpFull", "blurThumbnail"]:
            file_path = ROOT / photo[key]
            if not file_path.exists():
                missing.append(str(file_path))
    if missing:
        raise FileNotFoundError("Missing generated files:\n" + "\n".join(missing))


def main() -> None:
    ensure_dirs()

    photos = []
    attributions = []

    for spec in PHOTO_SPECS:
        photo_id = spec["id"]
        slug = spec["slug"]
        temp_path = TMP_DIR / f"photo-{photo_id:02d}-source.jpg"

        print(f"Downloading photo {photo_id:02d} from Unsplash...")
        author_name = fetch_author_name(slug)
        download_original(slug, temp_path)
        variants = build_variants(temp_path, photo_id, spec["category"])

        photos.append(
            {
                "id": photo_id,
                "title": spec["title"],
                "category": spec["category"],
                **variants,
                "metadata": spec["metadata"],
            }
        )

        attributions.append(
            {
                "id": photo_id,
                "title": spec["title"],
                "category": spec["category"],
                "photographer": author_name,
                "source": unsplash_page_url(slug),
            }
        )

        temp_path.unlink(missing_ok=True)

    validate_outputs(photos)

    PHOTOS_JSON.write_text(
        json.dumps({"photos": photos}, ensure_ascii=False, indent=4) + "\n",
        encoding="utf-8",
    )

    attribution_lines = [
        "# Image Attribution",
        "",
        f"Downloaded on {datetime.now().strftime('%Y-%m-%d')} from Unsplash public download endpoints for local learning/demo use.",
        "Black-and-white entries were converted to monochrome locally to match the project category design.",
        "",
    ]
    for item in attributions:
        attribution_lines.append(
            f"- `photo-{item['id']:02d}` | {item['title']} | {item['category']} | Photographer: {item['photographer']} | Source: {item['source']}"
        )

    ATTRIBUTION_MD.write_text("\n".join(attribution_lines) + "\n", encoding="utf-8")
    print(f"Wrote {PHOTOS_JSON.relative_to(ROOT)} and {ATTRIBUTION_MD.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
