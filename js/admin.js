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

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
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

    check() {
        const hostname = window.location.hostname;
        this.isLocal = hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname === '' ||
            hostname.startsWith('192.168.');

        if (this.isLocal) {
            document.getElementById('access-control').hidden = true;
            document.getElementById('admin-app').hidden = false;
            return true;
        }

        return false;
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
            'import-export': '导入导出'
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

    saveDraft() {
        this.readForm();
        toast.success('当前首页配置已写入编辑状态，导出 config.json 后替换 data/config.json 即可同步到首页');
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
        document.getElementById('btn-save').addEventListener('click', () => {
            const activeSection = navigation.getActiveSectionId();

            if (activeSection === 'photos-manage') {
                toast.success('作品集修改已保留在当前编辑状态，导出 photos.json 后替换 data/photos.json 即可同步到首页');
                return;
            }

            if (activeSection === 'import-export') {
                importExport.exportProjectFiles();
                return;
            }

            this.saveDraft();
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

    async init() {
        await this.loadPhotos();
        this.bindEvents();
        this.renderList();
    },

    async loadPhotos() {
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
        } catch (error) {
            this.sourcePhotos = [];
            this.photos = [];
            toast.error(`${error.message}，作品集初始化为空`);
        }
    },

    normalizePhoto(photo, fallbackId) {
        const normalizedId = Number(photo?.id);
        const metadata = utils.mergeDeep(ADMIN_CONFIG.defaultPhotoMetadata, photo?.metadata || {});
        const category = ADMIN_CONFIG.photoCategories.includes(photo?.category) ? photo.category : 'portrait';

        return {
            id: Number.isFinite(normalizedId) && normalizedId > 0 ? normalizedId : fallbackId,
            title: photo?.title || '',
            category,
            thumbnail: photo?.thumbnail || '',
            fullImage: photo?.fullImage || '',
            webpThumbnail: photo?.webpThumbnail || '',
            webpFull: photo?.webpFull || '',
            blurThumbnail: photo?.blurThumbnail || '',
            metadata
        };
    },

    normalizePhotos(photos) {
        return (Array.isArray(photos) ? photos : [])
            .map((photo, index) => this.normalizePhoto(photo, index + 1))
            .sort((a, b) => a.id - b.id);
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
            <div class="photo-item" data-id="${photo.id}">
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
    },

    openModal(title = '添加作品') {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('photo-modal').hidden = false;
    },

    closeModal() {
        document.getElementById('photo-modal').hidden = true;
        document.getElementById('photo-form').reset();
        this.editingId = null;
    },

    add() {
        this.editingId = null;
        document.getElementById('photo-form').reset();
        document.getElementById('photo-id').value = '';
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

        this.openModal('编辑作品');
    },

    collectFormData() {
        const rawPhoto = {
            id: this.editingId || this.getNextId(),
            title: document.getElementById('photo-title').value.trim(),
            category: document.getElementById('photo-category').value,
            thumbnail: document.getElementById('photo-thumbnail').value.trim(),
            fullImage: document.getElementById('photo-fullimage').value.trim(),
            webpThumbnail: document.getElementById('photo-webp-thumbnail').value.trim(),
            webpFull: document.getElementById('photo-webp-full').value.trim(),
            blurThumbnail: document.getElementById('photo-blur-thumbnail').value.trim(),
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

    delete(id) {
        if (!confirm('确定要删除这个作品吗？')) {
            return;
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

    bindEvents() {
        document.getElementById('btn-add-photo').addEventListener('click', () => this.add());
        document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('btn-modal-cancel').addEventListener('click', () => this.closeModal());
        document.getElementById('btn-modal-save').addEventListener('click', () => this.save());
        document.querySelector('#photo-modal .modal-backdrop').addEventListener('click', () => this.closeModal());
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
// 初始化
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    toast.init();

    if (!accessControl.check()) {
        return;
    }

    navigation.init();
    await configManager.init();
    await photosManager.init();
    importExport.init();

    console.log('Admin panel initialized');
});
