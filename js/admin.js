/**
 * 管理后台 JavaScript
 */

// ============================================
// 配置
// ============================================

const ADMIN_CONFIG = {
    paths: {
        config: 'data/config.json',
        photos: 'data/photos.json'
    },
    api: {
        login: 'api/login',
        config: 'api/save-config',
        photos: 'api/save-photos',
        project: 'api/save-project',
        upload: 'api/upload-photo',
        checkPaths: 'api/check-paths',
        deleteAssets: 'api/delete-photo-assets',
        listBackups: 'api/list-backups',
        restoreBackup: 'api/restore-backup',
        integrityCheck: 'api/integrity-check',
        changePassword: 'api/change-password',
        listMessages: 'api/list-messages'
    },
    auth: {
        storageKey: 'imageexhibition-admin-password'
    },
    defaultConfig: {
        hero: {
            titleLine1: '光影之间',
            titleLine2: '定格美好',
            subtitle: '用镜头记录世界的每一个精彩瞬间',
            description: '专注于人像、风光、纪实与黑白摄影，在光与影的交织中，发现生活的美'
        },
        buttons: {
            primary: { text: '浏览作品', link: '#portfolio' },
            secondary: { text: '联系我', link: '#contact' }
        },
        brand: {
            name: '光影之间',
            copyright: '© 2026 光影之间. 保留所有权利.'
        },
        theme: {
            accentColor: '#667eea',
            accentHover: '#5a67d8',
            bgType: 'gradient',
            gradient: {
                start: '#667eea',
                mid: '#764ba2',
                end: '#f093fb'
            },
            bgImage: '',
            dark: {
                bgPrimary: '#1a1a1a',
                textPrimary: '#f8f9fa'
            }
        }
    },
    defaultPhotoMetadata: {
        camera: '',
        lens: '',
        aperture: '',
        shutter: '',
        iso: '',
        location: '',
        date: '',
        description: ''
    },
    photoCategories: ['portrait', 'landscape', 'documentary', 'blackwhite']
};

// ============================================
// 工具函数
// ============================================

const utils = {
    isPlainObject(value) {
        return Object.prototype.toString.call(value) === '[object Object]';
    },

    deepClone(value) {
        return JSON.parse(JSON.stringify(value));
    },

    escapeHTML(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    mergeDeep(base, overrides) {
        const merged = utils.deepClone(base);

        if (!utils.isPlainObject(overrides)) {
            return merged;
        }

        Object.keys(overrides).forEach((key) => {
            const nextValue = overrides[key];

            if (utils.isPlainObject(nextValue) && utils.isPlainObject(merged[key])) {
                merged[key] = utils.mergeDeep(merged[key], nextValue);
            } else if (nextValue !== undefined) {
                merged[key] = nextValue;
            }
        });

        return merged;
    },

    async fetchJSON(path) {
        const response = await fetch(`${path}?t=${Date.now()}`, {
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`无法读取 ${path}（HTTP ${response.status}）`);
        }

        return response.json();
    },

    async postJSON(path, data) {
        const headers = {
            'Content-Type': 'application/json'
        };

        const password = accessControl.getPassword();
        if (password) {
            headers['X-Admin-Password'] = password;
        }

        const response = await fetch(path, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });

        let responseData = null;
        try {
            responseData = await response.json();
        } catch (error) {
            responseData = null;
        }

        if (!response.ok) {
            const message = responseData?.error || `HTTP ${response.status}`;
            throw new Error(message);
        }

        return responseData;
    },

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    },

    async uploadImage(file, { photoId, category, focusX, focusY }) {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('photoId', String(photoId || ''));
        formData.append('category', category || 'portrait');
        formData.append('focusX', String(focusX ?? 0.5));
        formData.append('focusY', String(focusY ?? 0.5));

        const headers = {};
        const password = accessControl.getPassword();
        if (password) {
            headers['X-Admin-Password'] = password;
        }

        const response = await fetch(ADMIN_CONFIG.api.upload, {
            method: 'POST',
            headers,
            body: formData
        });

        let responseData = null;
        try {
            responseData = await response.json();
        } catch (error) {
            responseData = null;
        }

        if (!response.ok) {
            const message = responseData?.error || `HTTP ${response.status}`;
            throw new Error(message);
        }

        return responseData;
    },

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    resolve(JSON.parse(event.target.result));
                } catch (error) {
                    reject(new Error('无效的 JSON 文件'));
                }
            };
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    }
};

// ============================================
// Toast 提示
// ============================================

const toast = {
    container: null,

    init() {
        this.container = document.getElementById('toast-container');
    },

    show(message, type = 'info') {
        const toastEl = document.createElement('div');
        toastEl.className = `toast ${type}`;
        toastEl.innerHTML = `
            <span>${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
            <span>${message}</span>
        `;
        this.container.appendChild(toastEl);

        setTimeout(() => {
            toastEl.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toastEl.remove(), 300);
        }, 3000);
    },

    success(message) {
        this.show(message, 'success');
    },

    error(message) {
        this.show(message, 'error');
    }
};

// ============================================
// 访问控制
// ============================================

const accessControl = {
    isLocal: false,
    authRequired: true,

    async check() {
        const hostname = window.location.hostname;
        this.isLocal = hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname.startsWith('192.168.');

        if (!this.isLocal) {
            return false;
        }

        await this.loadStatus();
        this.bindLoginForm();

        if (!this.authRequired || this.getPassword()) {
            if (!this.authRequired || await this.verifyPassword(this.getPassword())) {
                this.showApp();
                return true;
            }
            this.clearPassword();
        }

        this.showLogin();
        return false;
    },

    async loadStatus() {
        try {
            const response = await fetch('api/status', { cache: 'no-store' });
            const data = await response.json();
            this.authRequired = Boolean(data.authRequired);
        } catch (error) {
            this.authRequired = false;
        }
    },

    getPassword() {
        return sessionStorage.getItem(ADMIN_CONFIG.auth.storageKey) || '';
    },

    setPassword(password) {
        sessionStorage.setItem(ADMIN_CONFIG.auth.storageKey, password);
    },

    clearPassword() {
        sessionStorage.removeItem(ADMIN_CONFIG.auth.storageKey);
    },

    async verifyPassword(password) {
        if (!password && this.authRequired) {
            return false;
        }

        try {
            const response = await fetch(ADMIN_CONFIG.api.login, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    },

    bindLoginForm() {
        const form = document.getElementById('login-form');
        if (!form || form.dataset.bound === 'true') {
            return;
        }

        form.dataset.bound = 'true';
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const input = document.getElementById('admin-password');
            const password = input.value;

            if (await this.verifyPassword(password)) {
                this.setPassword(password);
                this.showApp();
                await initializeAdminApp();
            } else {
                this.clearPassword();
                document.getElementById('access-hint').textContent = '密码不正确，请重试';
                input.select();
            }
        });
    },

    showLogin() {
        document.getElementById('access-control').hidden = false;
        document.getElementById('admin-app').hidden = true;
        document.getElementById('login-form').hidden = false;
        document.getElementById('access-message').textContent = '请输入后台密码';
        document.getElementById('access-hint').textContent = '默认本地密码为 admin123，可通过启动参数修改';
        document.getElementById('admin-password').focus();
    },

    showApp() {
        document.getElementById('access-control').hidden = true;
        document.getElementById('admin-app').hidden = false;
    }
};

// ============================================
// 导航管理
// ============================================

const navigation = {
    init() {
        const navItems = document.querySelectorAll('.nav-item');
        const sections = document.querySelectorAll('.config-section');
        const titleEl = document.getElementById('section-title');

        const titles = {
            'home-config': '首页配置',
            'theme-config': '主题配置',
            'photos-manage': '作品管理',
            'import-export': '导入导出',
            'maintenance': '维护检查',
            'messages': '留言管理'
        };

        navItems.forEach((item) => {
            item.addEventListener('click', (event) => {
                event.preventDefault();
                const sectionId = item.dataset.section;

                navItems.forEach((navItem) => navItem.classList.remove('active'));
                item.classList.add('active');

                sections.forEach((section) => {
                    section.hidden = section.id !== sectionId;
                });

                titleEl.textContent = titles[sectionId] || '配置';

                if (sectionId === 'messages' && window.messagesManagerReady) {
                    messagesManager.loadMessages();
                }
            });
        });
    },

    getActiveSectionId() {
        return document.querySelector('.nav-item.active')?.dataset.section || 'home-config';
    }
};

// ============================================
// 配置管理
// ============================================

const configManager = {
    config: null,
    sourceConfig: null,

    async init() {
        await this.loadConfig();
        this.bindEvents();
        this.updateForm();
    },

    async loadConfig() {
        try {
            const data = await utils.fetchJSON(ADMIN_CONFIG.paths.config);
            const projectConfig = data.siteConfig || data;
            const merged = utils.mergeDeep(ADMIN_CONFIG.defaultConfig, projectConfig || {});

            this.sourceConfig = merged;
            this.config = utils.deepClone(merged);
            console.log('Admin loaded project config from data/config.json');
        } catch (error) {
            this.sourceConfig = utils.deepClone(ADMIN_CONFIG.defaultConfig);
            this.config = utils.deepClone(ADMIN_CONFIG.defaultConfig);
            toast.error(`${error.message}，已回退到默认配置`);
        }
    },

    updateForm() {
        const { hero, buttons, brand, theme } = this.config;

        document.getElementById('hero-title-line1').value = hero.titleLine1;
        document.getElementById('hero-title-line2').value = hero.titleLine2;
        document.getElementById('hero-subtitle').value = hero.subtitle;
        document.getElementById('hero-description').value = hero.description;

        document.getElementById('btn-primary-text').value = buttons.primary.text;
        document.getElementById('btn-primary-link').value = buttons.primary.link;
        document.getElementById('btn-secondary-text').value = buttons.secondary.text;
        document.getElementById('btn-secondary-link').value = buttons.secondary.link;

        document.getElementById('brand-name').value = brand.name;
        document.getElementById('footer-copyright').value = brand.copyright;

        document.getElementById('color-accent').value = theme.accentColor;
        document.getElementById('color-accent-text').value = theme.accentColor;
        document.getElementById('color-accent-hover').value = theme.accentHover;
        document.getElementById('color-accent-hover-text').value = theme.accentHover;

        const bgTypeInput = document.querySelector(`input[name="bg-type"][value="${theme.bgType}"]`);
        if (bgTypeInput) {
            bgTypeInput.checked = true;
        }
        this.toggleBgConfig(theme.bgType);

        document.getElementById('gradient-start').value = theme.gradient.start;
        document.getElementById('gradient-start-text').value = theme.gradient.start;
        document.getElementById('gradient-mid').value = theme.gradient.mid;
        document.getElementById('gradient-mid-text').value = theme.gradient.mid;
        document.getElementById('gradient-end').value = theme.gradient.end;
        document.getElementById('gradient-end-text').value = theme.gradient.end;

        document.getElementById('bg-image-url').value = theme.bgImage || '';

        document.getElementById('dark-bg-primary').value = theme.dark.bgPrimary;
        document.getElementById('dark-bg-primary-text').value = theme.dark.bgPrimary;
        document.getElementById('dark-text-primary').value = theme.dark.textPrimary;
        document.getElementById('dark-text-primary-text').value = theme.dark.textPrimary;

        this.updateGradientPreview();
    },

    readForm() {
        this.config.hero = {
            titleLine1: document.getElementById('hero-title-line1').value.trim(),
            titleLine2: document.getElementById('hero-title-line2').value.trim(),
            subtitle: document.getElementById('hero-subtitle').value.trim(),
            description: document.getElementById('hero-description').value.trim()
        };

        this.config.buttons = {
            primary: {
                text: document.getElementById('btn-primary-text').value.trim(),
                link: document.getElementById('btn-primary-link').value.trim()
            },
            secondary: {
                text: document.getElementById('btn-secondary-text').value.trim(),
                link: document.getElementById('btn-secondary-link').value.trim()
            }
        };

        this.config.brand = {
            name: document.getElementById('brand-name').value.trim(),
            copyright: document.getElementById('footer-copyright').value.trim()
        };

        this.config.theme = {
            accentColor: document.getElementById('color-accent').value,
            accentHover: document.getElementById('color-accent-hover').value,
            bgType: document.querySelector('input[name="bg-type"]:checked').value,
            gradient: {
                start: document.getElementById('gradient-start').value,
                mid: document.getElementById('gradient-mid').value,
                end: document.getElementById('gradient-end').value
            },
            bgImage: document.getElementById('bg-image-url').value.trim(),
            dark: {
                bgPrimary: document.getElementById('dark-bg-primary').value,
                textPrimary: document.getElementById('dark-text-primary').value
            }
        };
    },

    async saveToProject(options = {}) {
        this.readForm();

        try {
            await utils.postJSON(ADMIN_CONFIG.api.config, this.getExportData());
            this.sourceConfig = utils.deepClone(this.config);

            if (!options.silent) {
                toast.success('已保存到 data/config.json，刷新首页即可生效');
            }

            return true;
        } catch (error) {
            toast.error(`直接保存 config.json 失败：${error.message}。可继续使用导出 JSON 手动替换。`);
            return false;
        }
    },

    saveDraft() {
        this.readForm();
        toast.success('当前首页配置已写入编辑状态，可导出 config.json 手动替换');
    },

    resetToSource() {
        this.config = utils.deepClone(this.sourceConfig || ADMIN_CONFIG.defaultConfig);
        this.updateForm();
        toast.success('已恢复为项目文件中的首页配置');
    },

    applyConfigData(configData, useAsSource = false) {
        const merged = utils.mergeDeep(ADMIN_CONFIG.defaultConfig, configData || {});
        this.config = utils.deepClone(merged);

        if (useAsSource) {
            this.sourceConfig = utils.deepClone(merged);
        }

        this.updateForm();
    },

    getExportData() {
        this.readForm();
        return {
            siteConfig: utils.deepClone(this.config),
            exportDate: new Date().toISOString()
        };
    },

    toggleBgConfig(type) {
        document.getElementById('gradient-config').hidden = type !== 'gradient';
        document.getElementById('image-config').hidden = type !== 'image';
    },

    updateGradientPreview() {
        const preview = document.getElementById('gradient-preview');
        const start = document.getElementById('gradient-start').value;
        const mid = document.getElementById('gradient-mid').value;
        const end = document.getElementById('gradient-end').value;
        preview.style.background = `linear-gradient(135deg, ${start} 0%, ${mid} 50%, ${end} 100%)`;
    },

    bindEvents() {
        document.getElementById('btn-save').addEventListener('click', async () => {
            const activeSection = navigation.getActiveSectionId();

            if (activeSection === 'photos-manage') {
                await photosManager.saveToProject();
                return;
            }

            if (activeSection === 'import-export') {
                await importExport.saveProjectFiles();
                return;
            }

            await this.saveToProject();
        });

        document.getElementById('btn-reset').addEventListener('click', () => {
            const activeSection = navigation.getActiveSectionId();

            if (activeSection === 'photos-manage') {
                if (confirm('确定要恢复为 data/photos.json 中的作品集吗？')) {
                    photosManager.resetToSource();
                }
                return;
            }

            if (activeSection === 'import-export') {
                if (confirm('确定要恢复为项目文件中的配置和作品集吗？')) {
                    this.resetToSource();
                    photosManager.resetToSource();
                    toast.success('已恢复为项目文件中的配置和作品集');
                }
                return;
            }

            if (confirm('确定要恢复为 data/config.json 中的配置吗？')) {
                this.resetToSource();
            }
        });

        document.querySelectorAll('input[name="bg-type"]').forEach((radio) => {
            radio.addEventListener('change', (event) => {
                this.toggleBgConfig(event.target.value);
            });
        });

        const colorInputs = [
            'color-accent',
            'color-accent-hover',
            'gradient-start',
            'gradient-mid',
            'gradient-end',
            'dark-bg-primary',
            'dark-text-primary'
        ];

        colorInputs.forEach((id) => {
            const colorInput = document.getElementById(id);
            const textInput = document.getElementById(`${id}-text`);

            if (!colorInput || !textInput) {
                return;
            }

            colorInput.addEventListener('input', () => {
                textInput.value = colorInput.value;
                if (id.startsWith('gradient')) {
                    this.updateGradientPreview();
                }
            });

            textInput.addEventListener('input', () => {
                if (/^#[0-9A-Fa-f]{6}$/.test(textInput.value)) {
                    colorInput.value = textInput.value;
                    if (id.startsWith('gradient')) {
                        this.updateGradientPreview();
                    }
                }
            });
        });
    }
};

// ============================================
// 作品管理
// ============================================

const photosManager = {
    photos: [],
    sourcePhotos: [],
    editingId: null,
    previewObjectUrl: null,

    async init() {
        await this.reloadFromProject();
        this.bindEvents();
        this.renderList();
    },

    async reloadFromProject(showToast = false) {
        try {
            const data = await utils.fetchJSON(ADMIN_CONFIG.paths.photos);
            const projectPhotos = Array.isArray(data.photos)
                ? data.photos
                : Array.isArray(data.photosData)
                    ? data.photosData
                    : [];

            const normalized = this.normalizePhotos(projectPhotos);
            this.sourcePhotos = normalized;
            this.photos = utils.deepClone(normalized);
            console.log('Admin loaded project photos from data/photos.json');
            this.renderList();

            if (showToast) {
                toast.success('已从 data/photos.json 重新读取作品列表');
            }
        } catch (error) {
            this.sourcePhotos = [];
            this.photos = [];
            this.renderList();
            toast.error(`${error.message}，作品集初始化为空`);
        }
    },

    normalizePhoto(photo, fallbackId) {
        const normalizedId = Number(photo?.id);
        const metadata = utils.mergeDeep(ADMIN_CONFIG.defaultPhotoMetadata, photo?.metadata || {});
        const category = ADMIN_CONFIG.photoCategories.includes(photo?.category) ? photo.category : 'portrait';
        const focus = utils.mergeDeep({ x: 0.5, y: 0.5 }, photo?.focus || {});

        return {
            id: Number.isFinite(normalizedId) && normalizedId > 0 ? normalizedId : fallbackId,
            title: photo?.title || '',
            category,
            thumbnail: photo?.thumbnail || '',
            fullImage: photo?.fullImage || '',
            webpThumbnail: photo?.webpThumbnail || '',
            webpFull: photo?.webpFull || '',
            blurThumbnail: photo?.blurThumbnail || '',
            focus: {
                x: Number.isFinite(Number(focus.x)) ? Number(focus.x) : 0.5,
                y: Number.isFinite(Number(focus.y)) ? Number(focus.y) : 0.5
            },
            metadata
        };
    },

    normalizePhotos(photos) {
        return (Array.isArray(photos) ? photos : [])
            .map((photo, index) => this.normalizePhoto(photo, index + 1));
    },

    applyPhotosData(photos, useAsSource = false) {
        const normalized = this.normalizePhotos(photos);
        this.photos = utils.deepClone(normalized);

        if (useAsSource) {
            this.sourcePhotos = utils.deepClone(normalized);
        }

        this.renderList();
    },

    resetToSource() {
        this.photos = utils.deepClone(this.sourcePhotos || []);
        this.renderList();
        toast.success('已恢复为项目文件中的作品集');
    },

    getNextId() {
        return this.photos.reduce((maxId, photo) => Math.max(maxId, Number(photo.id) || 0), 0) + 1;
    },

    getBatchStartId(count) {
        const nextId = this.getNextId();
        const ids = [];
        for (let index = 0; index < count; index += 1) {
            ids.push(nextId + index);
        }
        return ids;
    },

    filenameToTitle(filename) {
        const withoutExtension = filename.replace(/\.[^.]+$/, '');
        const cleaned = withoutExtension
            .replace(/[_-]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        return cleaned || '未命名作品';
    },

    createDraftFromUpload(file, category, result) {
        const paths = result.paths || {};
        const metadata = utils.mergeDeep(ADMIN_CONFIG.defaultPhotoMetadata, result.metadata || {});
        return this.normalizePhoto({
            id: result.photoId,
            title: this.filenameToTitle(file.name),
            category,
            thumbnail: paths.thumbnail || '',
            fullImage: paths.fullImage || '',
            webpThumbnail: paths.webpThumbnail || '',
            webpFull: paths.webpFull || '',
            blurThumbnail: paths.blurThumbnail || '',
            focus: { x: 0.5, y: 0.5 },
            metadata
        }, result.photoId);
    },

    setBatchUploadStatus(message) {
        const status = document.getElementById('batch-upload-status');
        if (status) {
            status.textContent = message;
        }
    },

    async batchUploadFiles(files) {
        const imageFiles = Array.from(files || []).filter((file) => file.type.startsWith('image/'));

        if (!imageFiles.length) {
            toast.error('请选择图片文件');
            return;
        }

        const uploadButton = document.getElementById('btn-batch-upload');
        const category = document.getElementById('batch-photo-category').value;
        const photoIds = this.getBatchStartId(imageFiles.length);
        const drafts = [];
        const failures = [];

        uploadButton.disabled = true;

        for (let index = 0; index < imageFiles.length; index += 1) {
            const file = imageFiles[index];
            const photoId = photoIds[index];
            this.setBatchUploadStatus(`正在处理 ${index + 1}/${imageFiles.length}: ${file.name}`);

            try {
                const result = await utils.uploadImage(file, { photoId, category, focusX: 0.5, focusY: 0.5 });
                if (result.duplicate) {
                    failures.push(`${file.name}: 已存在相同图片，已跳过生成`);
                } else {
                    drafts.push(this.createDraftFromUpload(file, category, result));
                }
            } catch (error) {
                failures.push(`${file.name}: ${error.message}`);
            }
        }

        if (drafts.length) {
            this.photos = this.normalizePhotos([...this.photos, ...drafts]);
            this.renderList();
            this.setBatchUploadStatus(`已生成 ${drafts.length} 条作品草稿，保存后同步到首页`);
            toast.success(`已生成 ${drafts.length} 条作品草稿`);
        } else {
            this.setBatchUploadStatus('批量上传失败，请确认已用本地后端启动，并安装 Pillow');
        }

        if (failures.length) {
            console.warn('Batch upload failures:', failures);
            toast.error(`${failures.length} 张图片上传失败，请查看控制台`);
        }

        uploadButton.disabled = false;
    },

    renderList() {
        const container = document.getElementById('photos-list');

        if (!this.photos.length) {
            container.innerHTML = '<p class="card-desc">暂无作品，点击“添加作品”按钮创建新的作品条目。</p>';
            return;
        }

        const categoryLabels = {
            portrait: '人像',
            landscape: '风光',
            documentary: '纪实',
            blackwhite: '黑白'
        };

        container.innerHTML = this.photos.map((photo) => `
            <div class="photo-item" data-id="${photo.id}" draggable="true">
                <button class="drag-handle" type="button" title="拖拽排序" aria-label="拖拽排序">::</button>
                <img src="${photo.thumbnail}" alt="${photo.title}" class="photo-thumb" onerror="this.src='https://via.placeholder.com/80x60?text=No+Image'">
                <div class="photo-info">
                    <div class="photo-title-text">${photo.title || '未命名作品'}</div>
                    <div class="photo-meta">${categoryLabels[photo.category] || photo.category} · ${photo.metadata.location || '未设置地点'}</div>
                </div>
                <div class="photo-actions">
                    <button class="btn btn-secondary btn-sm" onclick="photosManager.edit(${photo.id})">编辑</button>
                    <button class="btn btn-danger btn-sm" onclick="photosManager.delete(${photo.id})">删除</button>
                </div>
            </div>
        `).join('');

        this.bindListDragEvents();
    },

    bindListDragEvents() {
        const items = document.querySelectorAll('.photo-item');
        let draggedId = null;

        items.forEach((item) => {
            item.addEventListener('dragstart', (event) => {
                draggedId = Number(item.dataset.id);
                item.classList.add('dragging');
                event.dataTransfer.effectAllowed = 'move';
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                items.forEach((nextItem) => nextItem.classList.remove('drag-over'));
            });

            item.addEventListener('dragover', (event) => {
                event.preventDefault();
                if (Number(item.dataset.id) !== draggedId) {
                    item.classList.add('drag-over');
                }
            });

            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over');
            });

            item.addEventListener('drop', (event) => {
                event.preventDefault();
                item.classList.remove('drag-over');
                const targetId = Number(item.dataset.id);
                if (draggedId && draggedId !== targetId) {
                    this.movePhoto(draggedId, targetId);
                }
            });
        });
    },

    movePhoto(draggedId, targetId) {
        const fromIndex = this.photos.findIndex((photo) => Number(photo.id) === Number(draggedId));
        const toIndex = this.photos.findIndex((photo) => Number(photo.id) === Number(targetId));

        if (fromIndex === -1 || toIndex === -1) {
            return;
        }

        const [movedPhoto] = this.photos.splice(fromIndex, 1);
        this.photos.splice(toIndex, 0, movedPhoto);
        this.renderList();
        toast.success('作品顺序已调整，保存后同步到首页');
    },

    openModal(title = '添加作品') {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('photo-modal').hidden = false;
    },

    closeModal() {
        document.getElementById('photo-modal').hidden = true;
        document.getElementById('photo-form').reset();
        this.editingId = null;
        this.resetUploadPreview();
    },

    add() {
        this.editingId = null;
        document.getElementById('photo-form').reset();
        document.getElementById('photo-id').value = '';
        document.getElementById('photo-focus-x').value = '0.5';
        document.getElementById('photo-focus-y').value = '0.5';
        this.clearPathCheckResults();
        this.resetUploadPreview();
        this.openModal('添加作品');
    },

    edit(id) {
        const photo = this.photos.find((item) => Number(item.id) === Number(id));
        if (!photo) {
            return;
        }

        this.editingId = Number(id);
        document.getElementById('photo-id').value = photo.id;
        document.getElementById('photo-title').value = photo.title;
        document.getElementById('photo-category').value = photo.category;
        document.getElementById('photo-thumbnail').value = photo.thumbnail;
        document.getElementById('photo-fullimage').value = photo.fullImage;
        document.getElementById('photo-webp-thumbnail').value = photo.webpThumbnail || '';
        document.getElementById('photo-webp-full').value = photo.webpFull || '';
        document.getElementById('photo-blur-thumbnail').value = photo.blurThumbnail || '';
        document.getElementById('photo-description').value = photo.metadata.description || '';
        document.getElementById('photo-camera').value = photo.metadata.camera || '';
        document.getElementById('photo-lens').value = photo.metadata.lens || '';
        document.getElementById('photo-aperture').value = photo.metadata.aperture || '';
        document.getElementById('photo-shutter').value = photo.metadata.shutter || '';
        document.getElementById('photo-iso').value = photo.metadata.iso || '';
        document.getElementById('photo-location').value = photo.metadata.location || '';
        document.getElementById('photo-date').value = photo.metadata.date || '';
        document.getElementById('photo-focus-x').value = photo.focus?.x ?? 0.5;
        document.getElementById('photo-focus-y').value = photo.focus?.y ?? 0.5;
        this.clearPathCheckResults();
        this.setUploadPreview(photo.thumbnail);
        this.setUploadStatus('可重新上传图片并覆盖当前作品资源');

        this.openModal('编辑作品');
    },

    resetUploadPreview() {
        if (this.previewObjectUrl) {
            URL.revokeObjectURL(this.previewObjectUrl);
            this.previewObjectUrl = null;
        }

        const preview = document.getElementById('photo-upload-preview');
        if (preview) {
            preview.innerHTML = '<span class="photo-upload-icon">+</span>';
        }

        this.setUploadStatus('上传后会自动生成展示图、缩略图和 WebP 路径');
    },

    setUploadStatus(message) {
        const status = document.getElementById('photo-upload-status');
        if (status) {
            status.textContent = message;
        }
    },

    setUploadPreview(src) {
        if (this.previewObjectUrl && src !== this.previewObjectUrl) {
            URL.revokeObjectURL(this.previewObjectUrl);
            this.previewObjectUrl = null;
        }

        const preview = document.getElementById('photo-upload-preview');
        if (!preview || !src) {
            return;
        }

        preview.innerHTML = '';
        const image = document.createElement('img');
        image.src = src;
        image.alt = '';
        image.style.objectPosition = this.getFocusObjectPosition();
        preview.appendChild(image);
        this.renderFocusMarker();
    },

    getFocusObjectPosition() {
        const focus = this.getFocusValues();
        return `${focus.x * 100}% ${focus.y * 100}%`;
    },

    updatePreviewFocus() {
        const image = document.querySelector('#photo-upload-preview img');
        if (image) {
            image.style.objectPosition = this.getFocusObjectPosition();
        }
        this.renderFocusMarker();
    },

    renderFocusMarker() {
        const preview = document.getElementById('photo-upload-preview');
        if (!preview) return;

        let marker = preview.querySelector('.focus-marker');
        const image = preview.querySelector('img');
        if (!image) {
            marker?.remove();
            return;
        }

        if (!marker) {
            marker = document.createElement('span');
            marker.className = 'focus-marker';
            preview.appendChild(marker);
        }

        const focus = this.getFocusValues();
        marker.style.left = `${focus.x * 100}%`;
        marker.style.top = `${focus.y * 100}%`;
    },

    setFocusFromPreview(event) {
        const preview = document.getElementById('photo-upload-preview');
        const image = preview?.querySelector('img');
        if (!preview || !image) return;

        const rect = preview.getBoundingClientRect();
        const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
        const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
        document.getElementById('photo-focus-x').value = x.toFixed(2);
        document.getElementById('photo-focus-y').value = y.toFixed(2);
        this.updatePreviewFocus();
    },

    previewLocalFile(file) {
        if (this.previewObjectUrl) {
            URL.revokeObjectURL(this.previewObjectUrl);
        }

        this.previewObjectUrl = URL.createObjectURL(file);
        this.setUploadPreview(this.previewObjectUrl);
    },

    applyUploadedPaths(paths) {
        document.getElementById('photo-thumbnail').value = paths.thumbnail || '';
        document.getElementById('photo-fullimage').value = paths.fullImage || '';
        document.getElementById('photo-webp-thumbnail').value = paths.webpThumbnail || '';
        document.getElementById('photo-webp-full').value = paths.webpFull || '';
        document.getElementById('photo-blur-thumbnail').value = paths.blurThumbnail || '';

        if (paths.thumbnail) {
            this.setUploadPreview(`${paths.thumbnail}?t=${Date.now()}`);
        }
    },

    applyExifMetadata(metadata = {}) {
        const fieldMap = {
            camera: 'photo-camera',
            lens: 'photo-lens',
            aperture: 'photo-aperture',
            shutter: 'photo-shutter',
            iso: 'photo-iso',
            date: 'photo-date'
        };

        Object.entries(fieldMap).forEach(([key, id]) => {
            const input = document.getElementById(id);
            if (input && metadata[key] && !input.value.trim()) {
                input.value = metadata[key];
            }
        });
    },

    getFocusValues() {
        return {
            x: Number(document.getElementById('photo-focus-x').value) || 0.5,
            y: Number(document.getElementById('photo-focus-y').value) || 0.5
        };
    },

    getCurrentPhotoPaths() {
        return [
            document.getElementById('photo-thumbnail').value.trim(),
            document.getElementById('photo-fullimage').value.trim(),
            document.getElementById('photo-webp-thumbnail').value.trim(),
            document.getElementById('photo-webp-full').value.trim(),
            document.getElementById('photo-blur-thumbnail').value.trim()
        ].filter(Boolean);
    },

    clearPathCheckResults() {
        const container = document.getElementById('path-check-results');
        if (container) {
            container.textContent = '可检查当前图片路径是否存在';
        }
    },

    async validateCurrentPhotoPaths() {
        const paths = this.getCurrentPhotoPaths();
        if (!paths.length) {
            toast.error('请先填写图片路径');
            return;
        }

        try {
            const data = await utils.postJSON(ADMIN_CONFIG.api.checkPaths, { paths });
            const results = data.results || [];
            const okCount = results.filter((item) => item.exists).length;
            const resultHtml = results.map((item) => {
                const label = item.exists ? '存在' : '缺失';
                const className = item.exists ? 'ok' : 'missing';
                return `<span class="${className}">${label}: ${utils.escapeHTML(item.path)}</span>`;
            }).join('<br>');

            document.getElementById('path-check-results').innerHTML = resultHtml;

            const thumbPath = document.getElementById('photo-thumbnail').value.trim();
            const thumbResult = results.find((item) => item.path === thumbPath && item.exists);
            if (thumbResult) {
                this.setUploadPreview(`${thumbPath}?t=${Date.now()}`);
            }

            toast.success(`路径校验完成：${okCount}/${results.length} 个存在`);
        } catch (error) {
            toast.error(`路径校验失败：${error.message}`);
        }
    },

    async uploadImageFile(file) {
        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error('请选择图片文件');
            return;
        }

        const uploadArea = document.getElementById('photo-upload-area');
        const uploadButton = document.getElementById('btn-photo-upload');
        const photoIdInput = document.getElementById('photo-id');
        const photoId = this.editingId || Number(photoIdInput.value) || this.getNextId();
        const category = document.getElementById('photo-category').value;
        const focus = this.getFocusValues();

        photoIdInput.value = photoId;
        this.previewLocalFile(file);
        this.setUploadStatus('正在上传并生成图片资源...');
        uploadArea.classList.add('is-uploading');
        uploadButton.disabled = true;

        try {
            const result = await utils.uploadImage(file, { photoId, category, focusX: focus.x, focusY: focus.y });
            if (result.duplicate) {
                this.setUploadStatus('检测到重复图片，已复用现有资源路径');
                toast.error('检测到重复图片，未重复生成资源');
            }
            this.applyUploadedPaths(result.paths || {});
            this.applyExifMetadata(result.metadata || {});
            if (!result.duplicate) {
                this.setUploadStatus(`已生成 photo-${String(result.photoId).padStart(2, '0')} 的图片资源`);
                toast.success('图片已上传并自动填充路径');
            }
        } catch (error) {
            this.setUploadStatus('上传失败，请确认已用本地后端启动，并安装 Pillow');
            toast.error(`图片上传失败：${error.message}`);
        } finally {
            uploadArea.classList.remove('is-uploading');
            uploadButton.disabled = false;
        }
    },

    collectFormData() {
        const formPhotoId = Number(document.getElementById('photo-id').value);
        const rawPhoto = {
            id: this.editingId || (Number.isFinite(formPhotoId) && formPhotoId > 0 ? formPhotoId : this.getNextId()),
            title: document.getElementById('photo-title').value.trim(),
            category: document.getElementById('photo-category').value,
            thumbnail: document.getElementById('photo-thumbnail').value.trim(),
            fullImage: document.getElementById('photo-fullimage').value.trim(),
            webpThumbnail: document.getElementById('photo-webp-thumbnail').value.trim(),
            webpFull: document.getElementById('photo-webp-full').value.trim(),
            blurThumbnail: document.getElementById('photo-blur-thumbnail').value.trim(),
            focus: this.getFocusValues(),
            metadata: {
                description: document.getElementById('photo-description').value.trim(),
                camera: document.getElementById('photo-camera').value.trim(),
                lens: document.getElementById('photo-lens').value.trim(),
                aperture: document.getElementById('photo-aperture').value.trim(),
                shutter: document.getElementById('photo-shutter').value.trim(),
                iso: document.getElementById('photo-iso').value.trim(),
                location: document.getElementById('photo-location').value.trim(),
                date: document.getElementById('photo-date').value
            }
        };

        return this.normalizePhoto(rawPhoto, this.getNextId());
    },

    save() {
        const form = document.getElementById('photo-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const isEditing = Boolean(this.editingId);
        const photoData = this.collectFormData();

        if (this.editingId) {
            const index = this.photos.findIndex((photo) => Number(photo.id) === Number(this.editingId));
            if (index !== -1) {
                this.photos[index] = photoData;
            }
        } else {
            this.photos.push(photoData);
        }

        this.photos = this.normalizePhotos(this.photos);
        this.renderList();
        this.closeModal();
        toast.success(isEditing ? '作品已更新' : '作品已添加');
    },

    async delete(id) {
        const photo = this.photos.find((item) => Number(item.id) === Number(id));
        if (!photo || !confirm('确定要删除这个作品吗？')) {
            return;
        }

        const shouldDeleteAssets = confirm('是否同时删除这张作品关联的图片文件？');
        if (shouldDeleteAssets) {
            try {
                const paths = [
                    photo.thumbnail,
                    photo.fullImage,
                    photo.webpThumbnail,
                    photo.webpFull,
                    photo.blurThumbnail
                ].filter(Boolean);
                const preview = await utils.postJSON(ADMIN_CONFIG.api.checkPaths, { paths });
                const lines = (preview.results || []).map((item) => `${item.exists ? '[存在]' : '[缺失]'} ${item.path}`);
                if (!confirm(`将删除以下图片资源：\n\n${lines.join('\n')}\n\n确认继续吗？`)) {
                    return;
                }
                const result = await utils.postJSON(ADMIN_CONFIG.api.deleteAssets, { paths });
                toast.success(`已删除 ${result.deleted?.length || 0} 个图片文件`);
            } catch (error) {
                toast.error(`删除图片文件失败：${error.message}`);
                return;
            }
        }

        this.photos = this.photos.filter((photo) => Number(photo.id) !== Number(id));
        this.renderList();
        toast.success('作品已删除');
    },

    getExportData() {
        return {
            photos: this.normalizePhotos(this.photos),
            exportDate: new Date().toISOString()
        };
    },

    async saveToProject(options = {}) {
        try {
            const exportData = this.getExportData();
            await utils.postJSON(ADMIN_CONFIG.api.photos, exportData);
            this.sourcePhotos = utils.deepClone(exportData.photos);

            if (!options.silent) {
                toast.success('已保存到 data/photos.json，刷新首页即可生效');
            }

            return true;
        } catch (error) {
            toast.error(`直接保存 photos.json 失败：${error.message}。可继续使用导出 JSON 手动替换。`);
            return false;
        }
    },

    bindEvents() {
        document.getElementById('btn-add-photo').addEventListener('click', () => this.add());
        document.getElementById('btn-reload-photos').addEventListener('click', () => this.reloadFromProject(true));
        document.getElementById('btn-batch-upload').addEventListener('click', () => {
            document.getElementById('batch-photo-files').click();
        });
        document.getElementById('batch-photo-files').addEventListener('change', (event) => {
            const files = event.target.files;
            if (files.length) {
                this.batchUploadFiles(files);
            }
            event.target.value = '';
        });
        document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('btn-modal-cancel').addEventListener('click', () => this.closeModal());
        document.getElementById('btn-modal-save').addEventListener('click', () => this.save());
        document.getElementById('btn-check-photo-paths').addEventListener('click', () => this.validateCurrentPhotoPaths());
        document.getElementById('photo-focus-x').addEventListener('input', () => this.updatePreviewFocus());
        document.getElementById('photo-focus-y').addEventListener('input', () => this.updatePreviewFocus());
        document.querySelector('#photo-modal .modal-backdrop').addEventListener('click', () => this.closeModal());

        const uploadArea = document.getElementById('photo-upload-area');
        const uploadPreview = document.getElementById('photo-upload-preview');
        const uploadButton = document.getElementById('btn-photo-upload');
        const fileInput = document.getElementById('photo-image-file');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadPreview.addEventListener('click', (event) => {
            event.stopPropagation();
            if (uploadPreview.querySelector('img')) {
                this.setFocusFromPreview(event);
            } else {
                fileInput.click();
            }
        });
        uploadButton.addEventListener('click', (event) => {
            event.stopPropagation();
            fileInput.click();
        });

        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                this.uploadImageFile(file);
            }
            fileInput.value = '';
        });

        uploadArea.addEventListener('dragover', (event) => {
            event.preventDefault();
            uploadArea.classList.add('is-dragging');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('is-dragging');
        });

        uploadArea.addEventListener('drop', (event) => {
            event.preventDefault();
            uploadArea.classList.remove('is-dragging');
            const file = event.dataTransfer.files[0];
            if (file) {
                this.uploadImageFile(file);
            }
        });
    }
};

// ============================================
// 导入导出
// ============================================

const importExport = {
    init() {
        this.bindEvents();
    },

    showExportHint() {
        const hintHtml = `
            <div class="export-hint" style="
                margin-top: 1rem;
                padding: 1rem;
                background: #f0f9ff;
                border: 1px solid #0ea5e9;
                border-radius: 8px;
                font-size: 0.875rem;
                color: #0369a1;
            ">
                <strong>文件替换步骤：</strong><br>
                1. 下载导出的 <code>config.json</code> 和 <code>photos.json</code><br>
                2. 用它们替换项目中的 <code>data/config.json</code> 和 <code>data/photos.json</code><br>
                3. 刷新 <code>index.html</code>，首页会直接读取新的项目文件
            </div>
        `;

        let hintContainer = document.getElementById('export-hint-container');
        if (!hintContainer) {
            hintContainer = document.createElement('div');
            hintContainer.id = 'export-hint-container';
            const importExportSection = document.getElementById('import-export');
            importExportSection.insertBefore(hintContainer, importExportSection.firstChild);
        }

        hintContainer.innerHTML = hintHtml;

        setTimeout(() => {
            hintContainer.innerHTML = '';
        }, 10000);
    },

    exportConfig() {
        utils.downloadJSON(configManager.getExportData(), 'config.json');
        toast.success('已导出 config.json');
        this.showExportHint();
    },

    exportPhotos() {
        utils.downloadJSON(photosManager.getExportData(), 'photos.json');
        toast.success('已导出 photos.json');
        this.showExportHint();
    },

    exportProjectFiles() {
        this.exportConfig();
        setTimeout(() => {
            this.exportPhotos();
        }, 150);
    },

    async saveProjectFiles() {
        try {
            const configData = configManager.getExportData();
            const photosData = photosManager.getExportData();

            await utils.postJSON(ADMIN_CONFIG.api.project, {
                config: configData,
                photos: photosData
            });

            configManager.sourceConfig = utils.deepClone(configManager.config);
            photosManager.sourcePhotos = utils.deepClone(photosData.photos);
            toast.success('已保存 config.json 和 photos.json，刷新首页即可生效');
            return true;
        } catch (error) {
            toast.error(`直接保存项目文件失败：${error.message}。可使用导出按钮下载 JSON 后手动替换。`);
            return false;
        }
    },

    looksLikeSiteConfig(data) {
        return utils.isPlainObject(data) && (
            data.hero ||
            data.buttons ||
            data.brand ||
            data.theme
        );
    },

    looksLikePhotosArray(data) {
        return Array.isArray(data) && data.every((item) => utils.isPlainObject(item));
    },

    async import(file) {
        try {
            const data = await utils.readFile(file);
            let importedSomething = false;

            if (data.siteConfig) {
                configManager.applyConfigData(data.siteConfig);
                importedSomething = true;
            } else if (this.looksLikeSiteConfig(data)) {
                configManager.applyConfigData(data);
                importedSomething = true;
            }

            if (Array.isArray(data.photos)) {
                photosManager.applyPhotosData(data.photos);
                importedSomething = true;
            } else if (Array.isArray(data.photosData)) {
                photosManager.applyPhotosData(data.photosData);
                importedSomething = true;
            } else if (this.looksLikePhotosArray(data)) {
                photosManager.applyPhotosData(data);
                importedSomething = true;
            }

            if (!importedSomething) {
                throw new Error('无法识别的 JSON 格式');
            }

            toast.success('JSON 已导入到后台当前编辑状态');
        } catch (error) {
            toast.error(error.message);
        }
    },

    resetAll() {
        if (!confirm('确定要重置为默认空白状态吗？此操作不会修改项目文件，但会清空后台当前编辑内容。')) {
            return;
        }

        configManager.applyConfigData(ADMIN_CONFIG.defaultConfig);
        photosManager.applyPhotosData([]);
        toast.success('后台当前编辑内容已重置为默认状态');
    },

    bindEvents() {
        document.getElementById('btn-export-all').addEventListener('click', () => this.exportProjectFiles());
        document.getElementById('btn-export-config').addEventListener('click', () => this.exportConfig());
        document.getElementById('btn-export-photos').addEventListener('click', () => this.exportPhotos());
        document.getElementById('btn-reset-all').addEventListener('click', () => this.resetAll());

        const uploadArea = document.getElementById('file-upload-area');
        const fileInput = document.getElementById('import-file');

        uploadArea.addEventListener('click', () => fileInput.click());

        uploadArea.addEventListener('dragover', (event) => {
            event.preventDefault();
            uploadArea.style.borderColor = 'var(--admin-primary)';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '';
        });

        uploadArea.addEventListener('drop', (event) => {
            event.preventDefault();
            uploadArea.style.borderColor = '';

            const file = event.dataTransfer.files[0];
            if (file && file.name.endsWith('.json')) {
                this.import(file);
            } else {
                toast.error('请上传 JSON 文件');
            }
        });

        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                this.import(file);
            }
            fileInput.value = '';
        });
    }
};

// ============================================
// 维护检查
// ============================================

const maintenanceManager = {
    init() {
        this.bindEvents();
        this.refreshBackups();
    },

    bindEvents() {
        document.getElementById('btn-run-integrity-check').addEventListener('click', () => this.runIntegrityCheck());
        document.getElementById('btn-refresh-backups').addEventListener('click', () => this.refreshBackups());
        document.getElementById('btn-change-password').addEventListener('click', () => this.changePassword());
    },

    async runIntegrityCheck() {
        const button = document.getElementById('btn-run-integrity-check');
        button.disabled = true;

        try {
            const report = await utils.postJSON(ADMIN_CONFIG.api.integrityCheck, {});
            this.renderSummary(report.summary || {});
            this.renderIssues(report.issues || []);
            toast.success('数据完整性检查完成');
        } catch (error) {
            toast.error(`完整性检查失败：${error.message}`);
        } finally {
            button.disabled = false;
        }
    },

    renderSummary(summary) {
        const values = [
            summary.photos ?? 0,
            summary.errors ?? 0,
            summary.warnings ?? 0,
            summary.unreferencedAssets ?? 0
        ];

        document.querySelectorAll('#health-summary .metric-value').forEach((node, index) => {
            node.textContent = values[index];
        });
    },

    renderIssues(issues) {
        const container = document.getElementById('integrity-issues');

        if (!issues.length) {
            container.innerHTML = '<p class="card-desc">未发现问题。</p>';
            return;
        }

        container.innerHTML = issues.map((item) => `
            <div class="issue-item">
                <span class="issue-level ${utils.escapeHTML(item.level)}">${utils.escapeHTML(item.level)}</span>
                <div class="issue-message">${utils.escapeHTML(item.message)}</div>
            </div>
        `).join('');
    },

    async refreshBackups() {
        try {
            const data = await utils.postJSON(ADMIN_CONFIG.api.listBackups, {});
            this.renderBackups(data.backups || []);
        } catch (error) {
            document.getElementById('backup-list').innerHTML = `<p class="card-desc">读取备份失败：${utils.escapeHTML(error.message)}</p>`;
        }
    },

    renderBackups(backups) {
        const container = document.getElementById('backup-list');

        if (!backups.length) {
            container.innerHTML = '<p class="card-desc">暂无备份。保存项目文件后会自动生成。</p>';
            return;
        }

        container.innerHTML = backups.map((backup) => {
            const files = (backup.files || []).map((file) => `${file.name} (${Math.round(file.size / 1024)} KB)`).join(' · ');
            return `
                <div class="backup-item">
                    <div class="backup-meta">
                        <strong>${utils.escapeHTML(backup.id)}</strong>
                        <div class="backup-files">${utils.escapeHTML(files)}</div>
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="maintenanceManager.restoreBackup('${utils.escapeHTML(backup.id)}')">恢复</button>
                </div>
            `;
        }).join('');
    },

    async restoreBackup(backupId) {
        if (!confirm(`确定要恢复备份 ${backupId} 吗？当前文件会先自动备份。`)) {
            return;
        }

        try {
            const result = await utils.postJSON(ADMIN_CONFIG.api.restoreBackup, { backupId });
            toast.success(`已恢复：${(result.restored || []).join('、')}`);
            await configManager.loadConfig();
            configManager.updateForm();
            await photosManager.reloadFromProject();
            await this.refreshBackups();
        } catch (error) {
            toast.error(`恢复备份失败：${error.message}`);
        }
    },

    async changePassword() {
        const currentPassword = document.getElementById('current-admin-password').value;
        const newPassword = document.getElementById('new-admin-password').value;

        if (newPassword.length < 8) {
            toast.error('新密码至少需要 8 个字符');
            return;
        }

        try {
            await utils.postJSON(ADMIN_CONFIG.api.changePassword, {
                currentPassword,
                newPassword
            });
            accessControl.setPassword(newPassword);
            document.getElementById('current-admin-password').value = '';
            document.getElementById('new-admin-password').value = '';
            toast.success('后台密码已更新');
        } catch (error) {
            toast.error(`修改密码失败：${error.message}`);
        }
    }
};

// ============================================
// 留言管理
// ============================================

const messagesManager = {
    init() {
        document.getElementById('btn-refresh-messages').addEventListener('click', () => this.loadMessages());
    },

    async loadMessages() {
        try {
            const data = await utils.postJSON(ADMIN_CONFIG.api.listMessages, {});
            this.renderMessages(data.messages || []);
        } catch (error) {
            document.getElementById('message-list').innerHTML = `<p class="card-desc">读取留言失败：${utils.escapeHTML(error.message)}</p>`;
        }
    },

    renderMessages(messages) {
        const container = document.getElementById('message-list');

        if (!messages.length) {
            container.innerHTML = '<p class="card-desc">暂无留言。</p>';
            return;
        }

        container.innerHTML = messages.map((message) => `
            <div class="message-item">
                <div class="message-head">
                    <div>
                        <div class="message-sender">${utils.escapeHTML(message.name || '未命名')}</div>
                        <div class="message-email">${utils.escapeHTML(message.email || '')}</div>
                    </div>
                    <div class="message-date">${utils.escapeHTML(message.createdAt || '')}</div>
                </div>
                <div class="message-subject">${utils.escapeHTML(message.subject || '无主题')}</div>
                <div class="message-body">${utils.escapeHTML(message.message || '')}</div>
            </div>
        `).join('');
    }
};

// ============================================
// 初始化
// ============================================

let adminInitialized = false;

async function initializeAdminApp() {
    if (adminInitialized) {
        return;
    }

    adminInitialized = true;
    navigation.init();
    await configManager.init();
    await photosManager.init();
    importExport.init();
    maintenanceManager.init();
    messagesManager.init();
    window.messagesManagerReady = true;

    console.log('Admin panel initialized');
}

document.addEventListener('DOMContentLoaded', async () => {
    toast.init();

    if (!await accessControl.check()) {
        return;
    }

    await initializeAdminApp();
});
