# ImageExhibition

一个纯前端的个人摄影作品展示站点，包含公开展示页 `index.html` 和本地管理后台 `admin.html`。  
项目当前使用本地图片素材与 JSON 数据文件驱动页面内容，不依赖构建工具或后端服务。

## 项目特性

- 首页摄影作品展示，支持分类筛选
- 灯箱查看大图、作品信息和浏览切换
- 主题配置、首屏文案、品牌信息可视化编辑
- 本地管理后台可编辑作品集与站点配置
- 后台导出 `config.json` 和 `photos.json` 后，可直接替换项目文件
- 首页始终从项目的 `data/` 目录读取配置和作品数据，替换文件后刷新即可同步
- 内置本地图片资源，包含 JPG、WebP、模糊缩略图

## 目录结构

```text
ImageExhibition/
├─ admin.html                # 管理后台入口
├─ index.html                # 展示页入口
├─ css/
│  ├─ admin.css              # 后台样式
│  └─ style.css              # 前台样式
├─ data/
│  ├─ config.json            # 站点配置文件
│  └─ photos.json            # 作品集数据文件
├─ images/
│  ├─ full/                  # 高清 JPG
│  ├─ thumbs/                # 列表缩略图 JPG
│  ├─ blur/                  # 模糊缩略图
│  ├─ webp/
│  │  ├─ full/               # 高清 WebP
│  │  └─ thumbs/             # 缩略图 WebP
│  └─ ATTRIBUTION.md         # 素材来源与署名
├─ js/
│  ├─ admin.js               # 后台逻辑
│  └─ main.js                # 首页逻辑
└─ scripts/
   └─ download_unsplash_images.py
```

## 快速开始

### 1. 启动本地静态服务

后台读取 `data/config.json` 和 `data/photos.json` 时，必须通过本地 HTTP 服务访问。推荐使用 Python：

```bash
python -m http.server 8000
```

启动后访问：

- 首页：`http://127.0.0.1:8000/index.html`
- 后台：`http://127.0.0.1:8000/admin.html`

Windows 下也可以直接双击项目根目录的：

```bat
start-local.bat
```

这个脚本会：

- 在新窗口启动 `python -m http.server 8000`
- 自动打开首页
- 自动打开后台

说明：

- 管理后台设计为本地访问使用
- `admin.html` 需要通过 `localhost` / `127.0.0.1` 访问，不能依赖 `file://` 直接读取项目 JSON

## 页面与数据关系

### 首页 `index.html`

首页只读取两类项目文件：

- `data/config.json`：用于首页文案、品牌信息、主题配置
- `data/photos.json`：用于作品集列表、分类、灯箱内容

这意味着：

- 后台导出的文件只要替换到 `data/` 目录
- 刷新 `index.html` 后，首页会直接显示最新内容
- 不再依赖浏览器历史缓存中的旧作品数据覆盖页面

### 后台 `admin.html`

后台打开时会初始化读取：

- `data/config.json`
- `data/photos.json`

后台中的编辑是当前页面内的编辑状态。浏览器无法直接改写你的项目文件，因此需要通过“导出项目文件”下载 JSON，再替换到项目目录中。

## 后台使用流程

### 修改首页配置

1. 打开 `admin.html`
2. 在“首页配置”或“主题配置”中修改字段
3. 点击顶部“保存当前编辑”
4. 进入“导入导出”页，导出 `config.json`
5. 用下载的文件替换项目中的 `data/config.json`
6. 刷新 `index.html`

### 修改作品集

1. 打开 `admin.html`
2. 进入“作品管理”
3. 新增、编辑或删除作品
4. 如你已在项目外部替换过 `data/photos.json`，可先点击“从 JSON 重新读取”
5. 进入“导入导出”页，导出 `photos.json`
6. 用下载的文件替换项目中的 `data/photos.json`
7. 刷新 `index.html`

### 一次性导出全部项目文件

后台支持一键导出：

- `config.json`
- `photos.json`

替换项目中 `data/` 目录下同名文件后，首页会同步更新。

## 数据文件说明

### `data/config.json`

当前项目使用的结构如下：

```json
{
  "siteConfig": {
    "hero": {},
    "buttons": {},
    "brand": {},
    "theme": {}
  },
  "exportDate": "2026-03-11T00:00:00.000Z"
}
```

其中：

- `siteConfig.hero`：首屏标题、副标题、描述
- `siteConfig.buttons`：首屏按钮文本和跳转
- `siteConfig.brand`：品牌名称、页脚版权信息
- `siteConfig.theme`：主题色、渐变、背景图、暗色模式颜色

### `data/photos.json`

当前项目使用的结构如下：

```json
{
  "photos": [
    {
      "id": 1,
      "title": "作品标题",
      "category": "portrait",
      "thumbnail": "images/thumbs/photo-01.jpg",
      "fullImage": "images/full/photo-01.jpg",
      "webpThumbnail": "images/webp/thumbs/photo-01.webp",
      "webpFull": "images/webp/full/photo-01.webp",
      "blurThumbnail": "images/blur/photo-01-blur.jpg",
      "metadata": {
        "camera": "",
        "lens": "",
        "aperture": "",
        "shutter": "",
        "iso": "",
        "location": "",
        "date": "",
        "description": ""
      }
    }
  ],
  "exportDate": "2026-03-11T00:00:00.000Z"
}
```

### 分类值

作品分类固定使用以下四种：

- `portrait`
- `landscape`
- `documentary`
- `blackwhite`

## 图片资源说明

项目已经内置一批本地摄影素材，位于 `images/` 目录下。

资源类型包括：

- `images/full/`：灯箱使用的高清 JPG
- `images/thumbs/`：作品列表缩略图
- `images/webp/full/`：高清 WebP
- `images/webp/thumbs/`：缩略图 WebP
- `images/blur/`：列表的模糊占位图

素材来源与摄影师署名见：

- `images/ATTRIBUTION.md`

## 素材生成脚本

项目提供了一个素材生成脚本：

```bash
python scripts/download_unsplash_images.py
```

作用：

- 从 Unsplash 下载预设图片
- 生成本地 JPG、WebP、模糊缩略图
- 更新 `data/photos.json`
- 更新 `images/ATTRIBUTION.md`

### 依赖

脚本依赖 Pillow：

```bash
python -m pip install Pillow
```

## 技术栈

- HTML5
- CSS3
- 原生 JavaScript
- Python（仅用于素材下载与处理脚本）

## 开发说明

### 前台逻辑

`js/main.js` 负责：

- 首页主题切换
- 站点配置应用
- 作品数据读取
- 作品筛选
- 灯箱查看
- 表单校验

### 后台逻辑

`js/admin.js` 负责：

- 从项目 JSON 文件初始化后台
- 编辑首页配置和主题配置
- 编辑作品集条目
- 导出替换项目文件的 JSON
- 导入已有配置文件或作品文件

## 注意事项

- 后台导出的是下载文件，不会直接写回你的项目目录
- 替换 `data/config.json` 和 `data/photos.json` 后，首页才会真正同步
- 如果你修改了图片路径，需确保对应文件真实存在于项目目录中
- 作品数据建议保留完整字段，尤其是 `webpThumbnail`、`webpFull`、`blurThumbnail`

## 后续可扩展方向

- 后台增加图片预览与路径校验
- 增加作品排序和拖拽调整顺序
- 增加作品批量导入
- 接入真实后端，实现后台直接保存到文件或数据库
