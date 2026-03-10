# 管理后台页面 Spec

## Why
需要一个管理页面来配置摄影网站的首页内容，包括网站标题、副标题、背景设置等。该页面不对外暴露，仅用于管理员维护网站内容。

## What Changes
- 创建独立的 admin.html 管理页面
- 实现首页配置表单（标题、副标题、描述、按钮文本等）
- 实现主题配置（颜色、背景图片/渐变设置）
- 实现作品数据管理（增删改查）
- 实现配置导出/导入功能
- 添加简单的本地访问控制（不对外暴露）

## Impact
- 新增文件: admin.html, admin.css, admin.js
- 修改文件: data/config.json (新增配置文件)
- 不影响现有前端展示页面

## ADDED Requirements

### Requirement: 管理页面访问控制
The system SHALL provide a management page that is not publicly exposed.

#### Scenario: 本地访问
- **WHEN** 用户从本地访问 admin.html
- **THEN** 页面正常显示管理界面

#### Scenario: 外部访问限制
- **GIVEN** 页面部署在服务器上
- **WHEN** 外部用户尝试访问 admin.html
- **THEN** 显示访问受限提示或重定向到首页

### Requirement: 首页配置管理
The system SHALL allow administrators to configure homepage settings.

#### Scenario: 修改网站标题
- **WHEN** 管理员修改网站标题输入框
- **AND** 点击保存按钮
- **THEN** 配置保存到 localStorage
- **AND** 首页实时更新显示

#### Scenario: 修改副标题和描述
- **WHEN** 管理员修改副标题或描述
- **AND** 点击保存按钮
- **THEN** 配置保存并同步到首页

#### Scenario: 配置按钮文本和链接
- **WHEN** 管理员修改按钮文本或链接目标
- **AND** 点击保存按钮
- **THEN** 首页按钮相应更新

### Requirement: 主题配置管理
The system SHALL allow administrators to customize theme settings.

#### Scenario: 修改主题色
- **WHEN** 管理员选择新的主题色
- **AND** 点击保存
- **THEN** 网站主题色实时更新

#### Scenario: 设置背景类型
- **WHEN** 管理员选择背景类型（渐变/图片）
- **AND** 配置相应参数
- **THEN** 首页背景相应更新

#### Scenario: 自定义CSS变量
- **WHEN** 管理员修改CSS变量值
- **AND** 点击保存
- **THEN** 网站样式实时更新

### Requirement: 作品数据管理
The system SHALL provide CRUD operations for photo gallery data.

#### Scenario: 添加新作品
- **WHEN** 管理员填写作品信息表单
- **AND** 点击添加按钮
- **THEN** 新作品添加到数据列表
- **AND** 首页画廊显示新作品

#### Scenario: 编辑作品
- **WHEN** 管理员点击编辑按钮
- **AND** 修改作品信息
- **AND** 点击保存
- **THEN** 作品信息更新

#### Scenario: 删除作品
- **WHEN** 管理员点击删除按钮
- **AND** 确认删除操作
- **THEN** 作品从列表移除
- **AND** 首页不再显示该作品

#### Scenario: 批量导入作品
- **WHEN** 管理员上传JSON文件
- **THEN** 作品数据批量导入
- **AND** 验证数据格式

### Requirement: 配置持久化
The system SHALL persist configuration changes.

#### Scenario: 保存到localStorage
- **WHEN** 管理员保存配置
- **THEN** 数据保存到浏览器localStorage
- **AND** 刷新页面后配置保留

#### Scenario: 导出配置
- **WHEN** 管理员点击导出按钮
- **THEN** 生成JSON配置文件下载

#### Scenario: 导入配置
- **WHEN** 管理员上传JSON配置文件
- **THEN** 配置数据导入并应用
- **AND** 验证数据格式有效性

### Requirement: 实时预览
The system SHALL provide real-time preview of changes.

#### Scenario: 配置修改预览
- **WHEN** 管理员修改任何配置
- **THEN** 右侧或下方显示实时预览
- **AND** 预览反映最新配置

## MODIFIED Requirements
无

## REMOVED Requirements
无
