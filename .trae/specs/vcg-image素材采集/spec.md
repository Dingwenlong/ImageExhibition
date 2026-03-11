# 图片素材采集与管理系统 - 规格文档

## Why
当前项目缺少真实的图片素材，data/photos.json 中使用的是占位图（placeholder）。为了丰富项目展示效果，需要添加真实图片素材。

## What Changes
- 从免费图库获取高质量图片素材
- 将图片保存到本地 images 目录
- 更新 photos.json 数据文件

## Impact
- 受影响的功能：
  - 首页作品展示
  - 瀑布流/网格布局展示
  - 灯箱查看功能
  - 分类筛选功能

## ADDED Requirements
### Requirement: 图片素材获取
使用免费图库（如 Unsplash、Pexels）获取高质量图片素材，避免版权问题。

#### Scenario: 获取图片并更新数据
- **WHEN** 执行图片采集任务时
- **THEN** 从免费图库下载图片到本地，更新 photos.json 数据

### Requirement: 图片数据结构
图片数据必须包含以下字段：
- id: 唯一标识符
- title: 图片标题
- category: 分类（portrait/landscape/documentary/blackwhite）
- thumbnail: 缩略图路径
- fullImage: 高清大图路径
- webpThumbnail: WebP 缩略图路径
- webpFull: WebP 高清大图路径
- blurThumbnail: 模糊缩略图路径
- metadata: 拍摄元数据（camera/lens/aperture/shutter/iso/location/date/description）

## MODIFIED Requirements
### Requirement: photos.json 数据格式
现有数据格式保持不变，扩展支持本地图片路径引用。

## 注意事项
- 使用免费图库（Unsplash、Pexels、Pixabay）获取图片，确保合法使用
- 图片仅用于个人学习项目展示目的
- 尊重摄影师署名要求
