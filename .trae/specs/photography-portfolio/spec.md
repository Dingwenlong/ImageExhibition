# 个人摄影作品展示网站 - 产品需求文档

## Overview
- **Summary**: 基于 HTML5 的响应式个人摄影作品展示网站，采用"移动优先"设计理念，包含全屏沉浸式首屏、作品分类筛选、瀑布流展示、灯箱查看、手势交互等核心功能。
- **Purpose**: 为摄影师提供一个专业、美观、交互流畅的在线作品展示平台，兼顾艺术展示与用户体验。
- **Target Users**: 摄影师、摄影爱好者、潜在客户、访客

## Goals
- 构建视觉震撼的全屏沉浸式首屏体验
- 实现响应式布局，完美适配移动端、平板和PC端
- 提供流畅的作品分类筛选和瀑布流展示功能
- 实现功能完善的灯箱查看模式（支持手势和键鼠交互）
- 优化图片加载性能（懒加载、WebP格式、渐进式加载）
- 提供个人品牌展示和联系功能

## Non-Goals (Out of Scope)
- 后端用户管理系统（登录/注册）
- 作品上传后台管理系统
- 在线支付/商城功能
- 评论/点赞社交功能
- 多语言国际化支持
- 服务端渲染（SSR）

## Background & Context
- 项目类型：前端静态网站项目
- 技术栈：HTML5 + CSS3 + 原生 JavaScript
- 设计理念：移动优先（Mobile First）
- 目标浏览器：现代浏览器（Chrome、Firefox、Safari、Edge）
- 项目周期：6-8周

## Functional Requirements

### FR-1: 首页与导航模块
- **FR-1.1**: 全屏沉浸式首屏，使用 HTML5 `<header>` 和 `<figure>` 标签
- **FR-1.2**: 响应式导航栏（PC端固定顶部透明导航，滚动时背景变化）
- **FR-1.3**: 移动端汉堡菜单，点击滑出侧边栏导航
- **FR-1.4**: 首屏向下滚动提示箭头，CSS3 弹跳动画

### FR-2: 作品展示核心模块
- **FR-2.1**: 分类筛选系统（人像、风光、纪实、黑白等标签）
- **FR-2.2**: 响应式瀑布流/网格布局（PC端3-4列，平板2列，手机1列）
- **FR-2.3**: 图片懒加载（HTML5 `loading="lazy"` + IntersectionObserver API）
- **FR-2.4**: WebP 格式优先，JPEG/PNG 降级（`<picture>` 标签）

### FR-3: 作品详情交互模块
- **FR-3.1**: 全屏灯箱模式，遮罩层背景模糊
- **FR-3.2**: 显示作品元数据（拍摄参数、时间、地点、创作理念）
- **FR-3.3**: 移动端手势交互（左右滑动切换、双指捏合缩放）
- **FR-3.4**: PC端键鼠交互（方向键切换、ESC退出、悬停显示标题）

### FR-4: 个人品牌与管理模块
- **FR-4.1**: 关于我页面（个人简介、摄影理念、器材展示）
- **FR-4.2**: SVG 图标展示社交媒体链接
- **FR-4.3**: HTML5 联系表单
- **FR-4.4**: Web Share API 集成（移动端原生分享）
- **FR-4.5**: localStorage 记录浏览历史和偏好

## Non-Functional Requirements

### NFR-1: 性能要求
- 首屏加载时间 < 3秒（3G网络）
- Lighthouse 性能评分 > 90
- 图片懒加载减少首屏请求数量

### NFR-2: 兼容性要求
- 支持 Chrome 80+、Firefox 75+、Safari 13+、Edge 80+
- 移动端 iOS Safari 13+、Android Chrome 80+
- 优雅降级处理不支持的 API

### NFR-3: 可访问性要求
- 语义化 HTML5 标签
- 键盘导航支持
- 适当的 ARIA 标签
- 足够的颜色对比度

### NFR-4: 动画性能
- 动画时长 300ms-500ms
- 使用 CSS3 `transform` 和 `opacity` 实现硬件加速
- 避免触发重排的属性动画

## Constraints

### Technical
- 纯前端实现，无后端依赖
- 使用原生 JavaScript，不引入大型框架
- 图片资源需要自行准备或使用占位图

### Business
- 毕业设计/结题项目性质
- 需要撰写开发文档和论文

### Dependencies
- 无外部 API 依赖
- 可选：使用 CDN 加载轻量级工具库

## Assumptions
- 用户有基本的现代浏览器
- 图片资源已准备好或可以使用占位图
- 项目主要用于展示目的，不涉及复杂的业务逻辑

## Acceptance Criteria

### AC-1: 响应式导航
- **Given**: 用户访问网站
- **When**: 在PC端浏览时
- **Then**: 显示固定顶部横向导航栏，滚动时背景变化
- **Verification**: `human-judgment`
- **Notes**: 需要视觉检查导航栏样式和滚动效果

### AC-2: 移动端汉堡菜单
- **Given**: 用户在移动端访问网站
- **When**: 点击汉堡菜单图标
- **Then**: 侧边栏导航从右侧滑出，点击链接或遮罩层关闭
- **Verification**: `programmatic`
- **Notes**: 可以通过浏览器开发者工具模拟移动端测试

### AC-3: 作品分类筛选
- **Given**: 用户在作品展示页面
- **When**: 点击分类标签（如"人像"）
- **Then**: 作品网格动态过滤显示对应分类，带有平滑过渡动画
- **Verification**: `programmatic`
- **Notes**: 检查 DOM 元素显示/隐藏状态和动画效果

### AC-4: 响应式网格布局
- **Given**: 用户在不同设备上访问
- **When**: 改变浏览器窗口大小
- **Then**: 作品网格自动调整列数（PC 3-4列，平板2列，手机1列）
- **Verification**: `programmatic`
- **Notes**: 使用 CSS Grid 或 Flexbox 媒体查询实现

### AC-5: 图片懒加载
- **Given**: 作品展示页面有多张图片
- **When**: 页面初始加载时
- **Then**: 仅加载视口内的图片，滚动时动态加载更多
- **Verification**: `programmatic`
- **Notes**: 检查 Network 面板中的图片加载时机

### AC-6: WebP 格式降级
- **Given**: 浏览器支持/不支持 WebP 格式
- **When**: 加载图片时
- **Then**: 支持 WebP 的浏览器加载 WebP，不支持的加载 JPEG/PNG
- **Verification**: `programmatic`
- **Notes**: 使用 `<picture>` 标签实现

### AC-7: 灯箱全屏查看
- **Given**: 用户在作品展示页面
- **When**: 点击作品缩略图
- **Then**: 打开全屏灯箱，显示高清大图和作品元数据
- **Verification**: `human-judgment`
- **Notes**: 需要视觉检查灯箱效果和元数据展示

### AC-8: 移动端手势滑动
- **Given**: 用户在移动端打开灯箱
- **When**: 左右滑动屏幕
- **Then**: 切换到上一张/下一张作品
- **Verification**: `programmatic`
- **Notes**: 使用 Touch Events API 实现

### AC-9: 双指缩放
- **Given**: 用户在移动端打开灯箱
- **When**: 双指捏合/展开
- **Then**: 图片放大/缩小查看细节，松手自动回弹
- **Verification**: `human-judgment`
- **Notes**: 需要真机测试验证体验

### AC-10: 键盘导航
- **Given**: 用户在PC端打开灯箱
- **When**: 按左右方向键或ESC键
- **Then**: 左右方向键切换图片，ESC键退出灯箱
- **Verification**: `programmatic`
- **Notes**: 监听键盘事件实现

### AC-11: 联系表单
- **Given**: 用户在联系页面
- **When**: 填写并提交表单
- **Then**: 表单验证通过，显示提交成功提示
- **Verification**: `programmatic`
- **Notes**: 使用 HTML5 表单验证

### AC-12: Web Share API
- **Given**: 用户在移动端
- **When**: 点击分享按钮
- **Then**: 调用系统原生分享菜单（如不支持则隐藏按钮）
- **Verification**: `human-judgment`
- **Notes**: 需要真机测试

### AC-13: LocalStorage 浏览记录
- **Given**: 用户浏览过作品
- **When**: 下次访问网站时
- **Then**: 自动定位到上次浏览位置或显示相关推荐
- **Verification**: `programmatic`
- **Notes**: 检查 Application 面板中的 localStorage 数据

### AC-14: 回到顶部
- **Given**: 用户滚动页面到下方
- **When**: 点击回到顶部按钮
- **Then**: 页面平滑滚动到顶部
- **Verification**: `programmatic`
- **Notes**: 使用 CSS3 平滑滚动实现

### AC-15: 首屏滚动提示
- **Given**: 用户访问首页
- **When**: 页面加载完成
- **Then**: 显示向下滚动提示箭头，带有弹跳动画
- **Verification**: `human-judgment`
- **Notes**: 使用 CSS3 动画实现

## Open Questions
- [ ] 是否需要集成第三方图片托管服务（如 Cloudinary）？
- [ ] 联系表单提交后如何处理（前端模拟还是接入邮件服务）？
- [ ] 是否需要暗黑模式切换功能？
- [ ] 作品数据的组织方式（硬编码 JSON 还是考虑后期接入 CMS）？
