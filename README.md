# ImageExhibition

一个轻量级本地摄影作品展示站点，包含公开展示页 `index.html` 和本地管理后台 `admin.html`。  
项目使用本地图片素材与 JSON 数据文件驱动页面内容，并提供一个基于 Python 标准库的本地后端，用于让后台直接保存项目 JSON 文件。

## 项目特性

- 首页摄影作品展示，支持分类筛选
- 灯箱查看大图、作品信息和浏览切换
- 主题配置、首屏文案、品牌信息可视化编辑
- 本地管理后台可编辑作品集与站点配置
- 本地轻量后端支持后台直接写回 `data/config.json` 和 `data/photos.json`
- 后台支持上传作品图片，并自动生成 JPG、WebP、缩略图和模糊占位图
- 后台支持批量上传图片并自动生成作品草稿
- 后台支持作品拖拽排序、图片路径校验、删除作品时同步删除图片资源
- 后台支持本地登录密码保护
- 后台支持保存前自动备份、备份列表恢复和数据完整性检查
- 后台支持修改登录密码，并将密码以哈希形式保存到本地配置文件
- 上传图片时支持 EXIF 自动读取、重复图片检测和点击式缩略图焦点预览
- 前台联系表单会保存到本地留言文件，后台可查看留言
- 作品灯箱支持 `?photo=作品ID` URL 状态，方便分享具体作品
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
   ├─ local_server.py        # 本地轻量后端
   └─ download_unsplash_images.py
```

## 快速开始

### 1. 启动本地轻量后端

推荐使用项目内置的本地服务脚本：

```bash
python scripts/local_server.py --host 127.0.0.1 --port 8000
```

默认后台密码为：

```text
admin123
```

可以通过启动参数修改：

```bash
python scripts/local_server.py --host 127.0.0.1 --port 8000 --admin-password your-password
```

启动后访问：

- 首页：`http://127.0.0.1:8000/index.html`
- 后台：`http://127.0.0.1:8000/admin.html`

Windows 下也可以直接双击项目根目录的：

```bat
start-local.bat
```

这个脚本会：

- 在新窗口启动 `python scripts/local_server.py --host 127.0.0.1 --port 8000`
- 自动打开首页
- 自动打开后台

说明：

- 管理后台设计为本地访问使用
- `admin.html` 需要通过 `localhost` / `127.0.0.1` 访问，不能依赖 `file://` 直接读取或保存项目 JSON
- 如果只想纯静态预览，也可以运行 `python -m http.server 8000`，但后台无法直接保存文件，只能导出 JSON 手动替换

### 2. 在局域网其他电脑访问后台

如果需要让同一局域网内的另一台电脑访问后台，不能在另一台电脑上打开 `http://127.0.0.1:8000/admin.html`。`127.0.0.1` 永远表示“当前这台电脑自己”，不是运行项目的那台电脑。

在运行项目的电脑上启动局域网服务：

```bash
python scripts/local_server.py --host 0.0.0.0 --port 8000
```

Windows 下也可以直接双击：

```bat
start-lan.bat
```

然后在另一台电脑上访问运行项目电脑的局域网 IP，例如：

```text
http://192.168.1.23:8000/admin.html
```

如果出现 404，通常是因为服务不是在项目根目录启动，或使用了普通 `python -m http.server` 并且当前目录下没有 `admin.html`。请优先使用 `scripts/local_server.py` 或 `start-lan.bat`。如果页面无法连接，检查两台电脑是否在同一局域网，并允许 Python 通过 Windows 防火墙。

`start-local.bat` 和 `start-lan.bat` 会在启动前检查 8000 端口。如果 8000 已经被旧服务占用，脚本会提示关闭旧服务窗口或修改脚本中的 `PORT`。这种情况常见表现是浏览器能打开 `127.0.0.1:8000`，但 `/admin.html` 返回 404，因为访问到的是另一个目录的服务。

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

使用 `scripts/local_server.py` 启动时，后台可以通过本地 API 直接保存到项目文件：

- `POST /api/save-config`：写入 `data/config.json`
- `POST /api/save-photos`：写入 `data/photos.json`
- `POST /api/save-project`：一次性写入两个 JSON 文件
- `POST /api/upload-photo`：上传作品图片并生成本地图片资源
- `POST /api/check-paths`：检查图片路径是否存在
- `POST /api/delete-photo-assets`：删除作品关联图片资源
- `POST /api/list-backups`：列出自动备份
- `POST /api/restore-backup`：恢复指定备份
- `POST /api/integrity-check`：检查作品数据和图片资源完整性
- `POST /api/change-password`：修改后台密码
- `POST /api/contact-message`：保存前台联系表单留言
- `POST /api/list-messages`：后台读取留言列表

如果使用普通静态服务打开，浏览器无法直接改写项目文件，后台会提示直接保存失败；这时仍可通过“导入导出”下载 JSON，再替换到项目目录中。

## 后台使用流程

### 修改首页配置

1. 打开 `admin.html`
2. 在“首页配置”或“主题配置”中修改字段
3. 点击顶部“保存当前编辑”
4. 使用内置本地后端启动时，会直接写入 `data/config.json`
5. 刷新 `index.html`

### 修改作品集

1. 打开 `admin.html`
2. 进入“作品管理”
3. 新增、编辑或删除作品
4. 可点击“批量上传”一次选择多张图片，自动生成作品草稿
5. 也可在作品弹窗中选择或拖入单张图片，后台会自动生成图片资源并填入路径
6. 可拖拽作品列表调整展示顺序
7. 可在作品弹窗中校验图片路径，或调整缩略图裁切焦点后重新上传图片
8. 删除作品时可选择是否同步删除关联图片文件
9. 如你已在项目外部替换过 `data/photos.json`，可先点击“从 JSON 重新读取”
10. 点击顶部“保存当前编辑”
11. 使用内置本地后端启动时，会直接写入 `data/photos.json`
12. 刷新 `index.html`

### 一次性导出全部项目文件

后台支持一键保存或导出：

- `config.json`
- `photos.json`

使用内置本地后端时，在“导入导出”页点击顶部“保存当前编辑”会直接写入项目文件。导出按钮仍会下载 JSON，可用于备份或在纯静态服务下手动替换。

### 维护与恢复

1. 进入“维护检查”
2. 点击“运行检查”查看重复 ID、缺失图片、空标题、异常分类、未引用图片等问题
3. 每次后台直接保存 JSON 前，系统会自动把当前文件备份到 `backups/{yyyyMMdd-HHmmss}/`
4. 在“自动备份”列表中可恢复备份；恢复前也会先备份当前文件

### 安全与留言

- 在“维护检查”页可修改后台密码，新密码会写入 `data/admin.json`
- 前台“联系方式”表单提交后会写入 `data/messages.json`
- 在“留言管理”页可刷新并查看最新留言
- 上传图片时，如果检测到相同文件哈希，会提示重复并复用现有资源路径，不重复生成图片文件
- 作品弹窗中的图片预览可点击主体位置，调整缩略图裁切焦点后重新上传生效

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
- Python 标准库 `http.server`（本地轻量后端）
- Python + Pillow（用于图片上传处理与素材生成脚本）

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
- 通过本地 API 保存项目 JSON 文件
- 导出替换项目文件的 JSON
- 导入已有配置文件或作品文件

### 本地后端

`scripts/local_server.py` 负责：

- 托管 `index.html`、`admin.html`、图片、CSS、JS 等静态资源
- 提供 `POST /api/save-config`、`POST /api/save-photos`、`POST /api/save-project`、`POST /api/upload-photo`、`POST /api/check-paths`、`POST /api/delete-photo-assets`、`POST /api/list-backups`、`POST /api/restore-backup`、`POST /api/integrity-check`、`POST /api/change-password`、`POST /api/contact-message`、`POST /api/list-messages`
- 将后台提交的 JSON 原子替换写入 `data/` 目录
- 保存 JSON 前自动备份当前文件到 `backups/`
- 将上传图片生成到 `images/full/`、`images/thumbs/`、`images/webp/`、`images/blur/`
- 上传图片时读取 EXIF 元数据并计算 SHA-256 用于去重
- 对写入、上传、校验和删除接口执行后台密码校验
- 仅建议绑定 `127.0.0.1` 作为本地开发/维护工具使用

## 注意事项

- 通过 `scripts/local_server.py` 启动时，后台保存会直接写回项目目录
- 默认后台密码为 `admin123`，正式使用建议通过 `--admin-password` 修改
- 在后台修改密码后，将以哈希形式保存到 `data/admin.json`，优先级高于启动参数默认密码
- `backups/` 中保存的是本地自动备份，可按需清理或纳入自己的备份策略
- `data/messages.json` 与 `data/image_hashes.json` 是运行时生成的数据文件
- 图片上传需要安装 Pillow：`python -m pip install Pillow`
- 通过普通静态服务启动时，后台导出的是下载文件，不会直接写回项目目录
- 修改并保存 `data/config.json` 和 `data/photos.json` 后，刷新首页才会显示最新内容
- 如果你修改了图片路径，需确保对应文件真实存在于项目目录中
- 作品数据建议保留完整字段，尤其是 `webpThumbnail`、`webpFull`、`blurThumbnail`

## 后续可扩展方向

- 后台增加图片预览与路径校验
- 增加作品排序和拖拽调整顺序
- 增加作品批量导入
- 接入用户登录和权限控制
