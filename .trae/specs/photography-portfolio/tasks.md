# 个人摄影作品展示网站 - 实现计划

## [ ] Task 1: 项目基础架构搭建
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 创建项目目录结构（css/、js/、images/、data/）
  - 初始化 HTML5 基础模板（index.html）
  - 配置 CSS 变量（颜色、字体、间距、断点）
  - 创建基础 CSS 重置和通用样式
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `programmatic` TR-1.1: 项目目录结构完整，包含所有必要的子目录
  - `programmatic` TR-1.2: HTML5 文档类型声明正确，语义化标签使用规范
  - `human-judgment` TR-1.3: CSS 变量命名清晰，覆盖主要设计 token
- **Notes**: 移动优先，基础样式针对移动端，媒体查询覆盖平板和PC

## [ ] Task 2: 首页与导航模块
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 构建全屏沉浸式首屏（header + figure 标签）
  - 实现响应式导航栏（PC端固定透明导航，滚动变色）
  - 实现移动端汉堡菜单和侧边栏导航
  - 添加首屏向下滚动提示箭头动画
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-15
- **Test Requirements**:
  - `programmatic` TR-2.1: 导航栏在滚动时背景色正确变化（添加/移除 CSS 类）
  - `programmatic` TR-2.2: 汉堡菜单点击事件正确触发侧边栏显示/隐藏
  - `programmatic` TR-2.3: 侧边栏遮罩层点击正确关闭导航
  - `human-judgment` TR-2.4: 首屏视觉效果符合设计预期，滚动提示动画流畅
- **Notes**: 使用 IntersectionObserver 监听首屏可见性来控制导航样式

## [ ] Task 3: 作品数据结构与网格布局
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 创建作品数据 JSON 结构（id、title、category、thumbnail、fullImage、metadata）
  - 实现响应式网格布局（CSS Grid，手机1列、平板2列、PC 3-4列）
  - 使用 object-fit: cover 确保图片比例统一
  - 动态渲染作品卡片到网格中
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `programmatic` TR-3.1: JSON 数据结构完整，包含所有必要字段
  - `programmatic` TR-3.2: 网格布局在不同断点下显示正确列数（检查 window.innerWidth 和计算样式）
  - `programmatic` TR-3.3: 作品卡片正确渲染，数量与数据长度一致
  - `human-judgment` TR-3.4: 图片比例统一，视觉效果整齐
- **Notes**: 使用 CSS Grid 的 auto-fill 和 minmax 实现响应式

## [ ] Task 4: 图片懒加载与格式优化
- **Priority**: P0
- **Depends On**: Task 3
- **Description**: 
  - 实现 HTML5 loading="lazy" 属性
  - 使用 IntersectionObserver API 实现自定义懒加载
  - 使用 <picture> 标签实现 WebP 优先、JPEG 降级
  - 实现渐进式加载（模糊缩略图 -> 高清大图）
- **Acceptance Criteria Addressed**: AC-5, AC-6
- **Test Requirements**:
  - `programmatic` TR-4.1: 初始加载时仅加载视口内图片（Network 面板验证）
  - `programmatic` TR-4.2: 滚动时新图片正确加载（IntersectionObserver 回调触发）
  - `programmatic` TR-4.3: 支持 WebP 的浏览器加载 WebP，不支持的加载 JPEG
  - `human-judgment` TR-4.4: 渐进式加载效果平滑，用户体验良好
- **Notes**: 需要准备 WebP 和 JPEG 两种格式的图片资源

## [ ] Task 5: 分类筛选系统
- **Priority**: P0
- **Depends On**: Task 3
- **Description**: 
  - 创建分类筛选按钮组（全部、人像、风光、纪实、黑白）
  - 实现点击筛选功能（JavaScript 数组过滤）
  - 添加筛选切换的 CSS3 过渡动画
  - 更新网格布局显示筛选后的作品
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `programmatic` TR-5.1: 点击分类按钮正确过滤作品数组
  - `programmatic` TR-5.2: 筛选后 DOM 正确更新，显示对应分类作品
  - `programmatic` TR-5.3: 过渡动画时长在 300ms-500ms 之间
  - `human-judgment` TR-5.4: 筛选动画流畅，无明显卡顿
- **Notes**: 使用 CSS transition 和 opacity/transform 实现硬件加速动画

## [ ] Task 6: 灯箱全屏查看（基础功能）
- **Priority**: P0
- **Depends On**: Task 3
- **Description**: 
  - 实现灯箱 DOM 结构（遮罩层、图片容器、关闭按钮）
  - 点击缩略图打开灯箱，显示高清大图
  - 显示作品元数据（标题、拍摄参数、时间、地点、描述）
  - 点击遮罩层或关闭按钮退出灯箱
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `programmatic` TR-6.1: 点击缩略图正确打开灯箱（display: flex/block）
  - `programmatic` TR-6.2: 灯箱显示对应作品的高清大图
  - `programmatic` TR-6.3: 作品元数据正确显示在灯箱中
  - `programmatic` TR-6.4: 点击关闭按钮或遮罩层正确关闭灯箱
  - `human-judgment` TR-6.5: 遮罩层背景模糊效果正常，视觉层次清晰
- **Notes**: 使用 backdrop-filter 实现背景模糊，需要处理浏览器兼容性

## [ ] Task 7: 灯箱键盘交互
- **Priority**: P1
- **Depends On**: Task 6
- **Description**: 
  - 监听键盘事件（左右方向键、ESC键）
  - 左右方向键切换上一张/下一张作品
  - ESC 键退出灯箱模式
  - 处理边界情况（第一张/最后一张）
- **Acceptance Criteria Addressed**: AC-10
- **Test Requirements**:
  - `programmatic` TR-7.1: 按左方向键切换到上一张作品
  - `programmatic` TR-7.2: 按右方向键切换到下一张作品
  - `programmatic` TR-7.3: 按 ESC 键退出灯箱
  - `programmatic` TR-7.4: 在第一张按左键、最后一张按右键时正确处理（循环或边界提示）
- **Notes**: 使用 document.addEventListener('keydown') 监听键盘事件

## [ ] Task 8: 灯箱移动端手势交互
- **Priority**: P1
- **Depends On**: Task 6
- **Description**: 
  - 实现 Touch Events 监听（touchstart、touchmove、touchend）
  - 左右滑动切换作品（计算滑动距离和方向）
  - 区分点击和滑动操作（时间差 + 距离阈值）
  - 添加滑动时的视觉反馈
- **Acceptance Criteria Addressed**: AC-8
- **Test Requirements**:
  - `programmatic` TR-8.1: 左滑切换到下一部作品
  - `programmatic` TR-8.2: 右滑切换到上一部作品
  - `programmatic` TR-8.3: 短距离触摸（< 50px）识别为点击，不触发切换
  - `programmatic` TR-8.4: 快速滑动（< 300ms）正确识别为滑动操作
  - `human-judgment` TR-8.5: 滑动体验流畅，无误触
- **Notes**: 使用 e.preventDefault() 阻止默认滚动行为，滑动阈值建议 50px

## [ ] Task 9: 灯箱双指缩放功能
- **Priority**: P1
- **Depends On**: Task 6
- **Description**: 
  - 监听多点触摸事件（gesturestart、gesturechange、gestureend）
  - 实现双指捏合/展开缩放图片
  - 缩放范围限制（最小 1x，最大 3x）
  - 松手后自动回弹复位
- **Acceptance Criteria Addressed**: AC-9
- **Test Requirements**:
  - `programmatic` TR-9.1: 双指捏合缩小图片（scale < 1）
  - `programmatic` TR-9.2: 双指展开放大图片（scale > 1）
  - `programmatic` TR-9.3: 缩放比例限制在 1x-3x 范围内
  - `programmatic` TR-9.4: 松手后图片自动回弹到原始大小
  - `human-judgment` TR-9.5: 缩放体验自然，回弹动画平滑
- **Notes**: iOS Safari 支持 gesture 事件，Android 需要手动计算两点距离

## [ ] Task 10: 关于我页面
- **Priority**: P1
- **Depends On**: Task 1
- **Description**: 
  - 创建关于我页面结构和样式
  - 添加摄影师个人简介和摄影理念
  - 展示所用器材（相机、镜头等）
  - 使用 SVG 图标展示社交媒体链接
- **Acceptance Criteria Addressed**: AC-1（导航链接）
- **Test Requirements**:
  - `programmatic` TR-10.1: 页面结构完整，包含所有必要区块
  - `programmatic` TR-10.2: SVG 图标正确显示，链接可点击
  - `human-judgment` TR-10.3: 页面布局美观，信息层次清晰
- **Notes**: 使用内联 SVG 或 SVG 雪碧图管理图标

## [ ] Task 11: 联系表单
- **Priority**: P1
- **Depends On**: Task 1
- **Description**: 
  - 创建联系表单（姓名、邮箱、主题、留言内容）
  - 实现 HTML5 表单验证（required、type="email"、minlength等）
  - 添加表单提交处理（前端模拟，显示成功提示）
  - 表单样式美化
- **Acceptance Criteria Addressed**: AC-11
- **Test Requirements**:
  - `programmatic` TR-11.1: 必填字段为空时阻止提交并显示提示
  - `programmatic` TR-11.2: 邮箱格式不正确时显示验证错误
  - `programmatic` TR-11.3: 表单验证通过后显示提交成功提示
  - `human-judgment` TR-11.4: 表单样式美观，错误提示清晰友好
- **Notes**: 联系表单仅前端演示，实际项目中可接入邮件服务

## [ ] Task 12: Web Share API 集成
- **Priority**: P2
- **Depends On**: Task 6
- **Description**: 
  - 检测浏览器是否支持 Web Share API
  - 实现分享按钮（仅在支持的设备上显示）
  - 调用 navigator.share() 打开系统原生分享菜单
  - 分享内容包含作品标题和链接
- **Acceptance Criteria Addressed**: AC-12
- **Test Requirements**:
  - `programmatic` TR-12.1: 在不支持 Web Share API 的浏览器中隐藏分享按钮
  - `programmatic` TR-12.2: 点击分享按钮调用 navigator.share()
  - `programmatic` TR-12.3: 分享数据包含正确的标题、文本和 URL
  - `human-judgment` TR-12.4: 在支持的移动设备上能正常调用系统分享菜单
- **Notes**: Web Share API 主要在移动端 Chrome 和 Safari 支持

## [ ] Task 13: LocalStorage 浏览记录
- **Priority**: P2
- **Depends On**: Task 3, Task 5
- **Description**: 
  - 使用 localStorage 记录用户浏览历史（作品ID、分类）
  - 记录最后浏览位置（滚动位置或作品ID）
  - 下次访问时恢复浏览状态或推荐相关作品
  - 提供清除浏览历史功能
- **Acceptance Criteria Addressed**: AC-13
- **Test Requirements**:
  - `programmatic` TR-13.1: 浏览作品时正确记录到 localStorage
  - `programmatic` TR-13.2: 页面加载时正确读取并恢复浏览状态
  - `programmatic` TR-13.3: 清除历史功能正确清空 localStorage 数据
  - `programmatic` TR-13.4: localStorage 数据格式正确，可解析
- **Notes**: 注意 localStorage 容量限制（约 5MB），定期清理过期数据

## [ ] Task 14: 回到顶部功能
- **Priority**: P2
- **Depends On**: Task 1
- **Description**: 
  - 创建回到顶部按钮（滚动到一定位置显示）
  - 实现平滑滚动到顶部（CSS scroll-behavior 或 JS）
  - 添加按钮显示/隐藏的过渡动画
  - 移动端和PC端样式适配
- **Acceptance Criteria Addressed**: AC-14
- **Test Requirements**:
  - `programmatic` TR-14.1: 滚动超过一屏时显示回到顶部按钮
  - `programmatic` TR-14.2: 点击按钮页面平滑滚动到顶部
  - `programmatic` TR-14.3: 回到顶部后按钮自动隐藏
  - `human-judgment` TR-14.4: 滚动动画流畅，无卡顿
- **Notes**: 使用 CSS scroll-behavior: smooth 或 window.scrollTo({ behavior: 'smooth' })

## [ ] Task 15: 滚动触发动画
- **Priority**: P2
- **Depends On**: Task 1
- **Description**: 
  - 使用 IntersectionObserver 监听元素进入视口
  - 为页面元素添加入场动画（淡入、上移等）
  - 动画触发时机和时长控制
  - 避免动画过于频繁影响性能
- **Acceptance Criteria Addressed**: AC-1（首屏动画）
- **Test Requirements**:
  - `programmatic` TR-15.1: 元素进入视口时正确触发动画
  - `programmatic` TR-15.2: 动画时长控制在 300ms-500ms
  - `programmatic` TR-15.3: 使用 transform 和 opacity 实现硬件加速
  - `human-judgment` TR-15.4: 动画效果自然，提升页面质感
- **Notes**: 添加 will-change 属性优化动画性能，动画完成后移除

## [ ] Task 16: 跨浏览器兼容性处理
- **Priority**: P1
- **Depends On**: All previous tasks
- **Description**: 
  - 使用 Autoprefixer 处理 CSS 前缀
  - 检测 API 支持情况，提供 Polyfill 或降级方案
  - 测试主流浏览器兼容性（Chrome、Firefox、Safari、Edge）
  - 修复发现的兼容性问题
- **Acceptance Criteria Addressed**: All
- **Test Requirements**:
  - `programmatic` TR-16.1: CSS 前缀正确添加（-webkit-、-moz-等）
  - `programmatic` TR-16.2: 不支持的 API 有降级处理（如 Web Share、backdrop-filter）
  - `human-judgment` TR-16.3: 各浏览器中页面显示一致，无明显差异
- **Notes**: 使用 Can I Use 查询 API 兼容性

## [ ] Task 17: 性能优化与测试
- **Priority**: P1
- **Depends On**: All previous tasks
- **Description**: 
  - 使用 Chrome DevTools Lighthouse 进行性能评分
  - 优化图片大小和格式
  - 压缩 CSS/JS 文件
  - 修复性能瓶颈
- **Acceptance Criteria Addressed**: NFR-1
- **Test Requirements**:
  - `programmatic` TR-17.1: Lighthouse 性能评分 > 90
  - `programmatic` TR-17.2: 首屏加载时间 < 3秒（3G网络模拟）
  - `programmatic` TR-17.3: 图片资源经过压缩优化
  - `programmatic` TR-17.4: 无阻塞渲染的 CSS/JS
- **Notes**: 使用 Chrome DevTools 的 Performance 和 Network 面板分析

## [ ] Task 18: 冒烟测试与部署
- **Priority**: P0
- **Depends On**: All previous tasks
- **Description**: 
  - 执行完整的冒烟测试，验证所有功能正常
  - 修复发现的 Bug
  - 准备部署文件（压缩、优化）
  - 部署到静态托管服务（GitHub Pages/Vercel/Netlify）
- **Acceptance Criteria Addressed**: All
- **Test Requirements**:
  - `programmatic` TR-18.1: 所有核心功能通过冒烟测试
  - `programmatic` TR-18.2: 无控制台错误和警告
  - `programmatic` TR-18.3: 网站成功部署并可访问
  - `human-judgment` TR-18.4: 部署后的网站功能正常，性能良好
- **Notes**: 冒烟测试包括导航、筛选、灯箱、表单等主要功能路径
