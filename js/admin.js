/**
 * 管理后台 JavaScript
 */

// ============================================
// 配置
// ============================================

const ADMIN_CONFIG = {
    storageKeys: {
        siteConfig: 'portfolio-site-config',
        photosData: 'portfolio-photos-data'
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
            copyright: '© 2024 光影之间. 保留所有权利.'
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
    }
};

// ============================================
// 工具函数
// ============================================

const utils = {
    storage: {
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.warn('Storage get error:', e);
                return defaultValue;
            }
        },
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.warn('Storage set error:', e);
                return false;
            }
        },
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                return false;
            }
        }
    },
    
    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },
    
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    resolve(data);
                } catch (err) {
                    reject(new Error('无效的JSON文件'));
                }
            };
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    },
    
    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
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
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = item.dataset.section;
                
                navItems.forEach(n => n.classList.remove('active'));
                item.classList.add('active');
                
                sections.forEach(s => s.hidden = s.id !== sectionId);
                titleEl.textContent = titles[sectionId] || '配置';
            });
        });
    }
};

// ============================================
// 配置管理
// ============================================

const configManager = {
    config: null,
    
    init() {
        this.loadConfig();
        this.bindEvents();
        this.updateForm();
    },
    
    loadConfig() {
        this.config = utils.storage.get(
            ADMIN_CONFIG.storageKeys.siteConfig,
            ADMIN_CONFIG.defaultConfig
        );
    },
    
    saveConfig() {
        utils.storage.set(ADMIN_CONFIG.storageKeys.siteConfig, this.config);
        toast.success('配置已保存');
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
        
        document.querySelector(`input[name="bg-type"][value="${theme.bgType}"]`).checked = true;
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
            titleLine1: document.getElementById('hero-title-line1').value,
            titleLine2: document.getElementById('hero-title-line2').value,
            subtitle: document.getElementById('hero-subtitle').value,
            description: document.getElementById('hero-description').value
        };
        
        this.config.buttons = {
            primary: {
                text: document.getElementById('btn-primary-text').value,
                link: document.getElementById('btn-primary-link').value
            },
            secondary: {
                text: document.getElementById('btn-secondary-text').value,
                link: document.getElementById('btn-secondary-link').value
            }
        };
        
        this.config.brand = {
            name: document.getElementById('brand-name').value,
            copyright: document.getElementById('footer-copyright').value
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
            bgImage: document.getElementById('bg-image-url').value,
            dark: {
                bgPrimary: document.getElementById('dark-bg-primary').value,
                textPrimary: document.getElementById('dark-text-primary').value
            }
        };
    },
    
    toggleBgConfig(type) {
        document.getElementById('gradient-config').hidden = type !== 'gradient';
        document.getElementById('image-config').hidden = type !== 'image';
    },
    
    updateGradientPreview() {
        const preview = document.getElementById('gradient-preview');
        const { start, mid, end } = {
            start: document.getElementById('gradient-start').value,
            mid: document.getElementById('gradient-mid').value,
            end: document.getElementById('gradient-end').value
        };
        preview.style.background = `linear-gradient(135deg, ${start} 0%, ${mid} 50%, ${end} 100%)`;
    },
    
    bindEvents() {
        document.getElementById('btn-save').addEventListener('click', () => {
            this.readForm();
            this.saveConfig();
        });
        
        document.getElementById('btn-reset').addEventListener('click', () => {
            if (confirm('确定要重置当前页面的配置吗？')) {
                this.config = JSON.parse(JSON.stringify(ADMIN_CONFIG.defaultConfig));
                this.updateForm();
                toast.success('配置已重置');
            }
        });
        
        document.querySelectorAll('input[name="bg-type"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.toggleBgConfig(e.target.value);
            });
        });
        
        const colorInputs = ['color-accent', 'color-accent-hover', 'gradient-start', 'gradient-mid', 'gradient-end', 'dark-bg-primary', 'dark-text-primary'];
        colorInputs.forEach(id => {
            const colorInput = document.getElementById(id);
            const textInput = document.getElementById(`${id}-text`);
            
            if (colorInput && textInput) {
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
            }
        });
    }
};

// ============================================
// 作品管理
// ============================================

const photosManager = {
    photos: [],
    editingId: null,
    
    init() {
        this.loadPhotos();
        this.bindEvents();
        this.renderList();
    },
    
    loadPhotos() {
        this.photos = utils.storage.get(ADMIN_CONFIG.storageKeys.photosData, []);
        if (this.photos.length === 0) {
            fetch('data/photos.json')
                .then(res => res.json())
                .then(data => {
                    this.photos = data.photos || [];
                    this.renderList();
                })
                .catch(() => {
                    this.photos = [];
                });
        }
    },
    
    savePhotos() {
        utils.storage.set(ADMIN_CONFIG.storageKeys.photosData, this.photos);
    },
    
    renderList() {
        const container = document.getElementById('photos-list');
        
        if (this.photos.length === 0) {
            container.innerHTML = '<p class="card-desc">暂无作品，点击"添加作品"按钮添加。</p>';
            return;
        }
        
        const categoryLabels = {
            portrait: '人像',
            landscape: '风光',
            documentary: '纪实',
            blackwhite: '黑白'
        };
        
        container.innerHTML = this.photos.map(photo => `
            <div class="photo-item" data-id="${photo.id}">
                <img src="${photo.thumbnail}" alt="${photo.title}" class="photo-thumb" onerror="this.src='https://via.placeholder.com/80x60?text=No+Image'">
                <div class="photo-info">
                    <div class="photo-title-text">${photo.title}</div>
                    <div class="photo-meta">${categoryLabels[photo.category] || photo.category} · ${photo.metadata?.location || '未知地点'}</div>
                </div>
                <div class="photo-actions">
                    <button class="btn btn-secondary btn-sm" onclick="photosManager.edit('${photo.id}')">编辑</button>
                    <button class="btn btn-danger btn-sm" onclick="photosManager.delete('${photo.id}')">删除</button>
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
        const photo = this.photos.find(p => p.id == id);
        if (!photo) return;
        
        this.editingId = id;
        document.getElementById('photo-id').value = id;
        document.getElementById('photo-title').value = photo.title;
        document.getElementById('photo-category').value = photo.category;
        document.getElementById('photo-thumbnail').value = photo.thumbnail;
        document.getElementById('photo-fullimage').value = photo.fullImage;
        document.getElementById('photo-description').value = photo.metadata?.description || '';
        document.getElementById('photo-camera').value = photo.metadata?.camera || '';
        document.getElementById('photo-lens').value = photo.metadata?.lens || '';
        document.getElementById('photo-aperture').value = photo.metadata?.aperture || '';
        document.getElementById('photo-shutter').value = photo.metadata?.shutter || '';
        document.getElementById('photo-iso').value = photo.metadata?.iso || '';
        document.getElementById('photo-location').value = photo.metadata?.location || '';
        document.getElementById('photo-date').value = photo.metadata?.date || '';
        
        this.openModal('编辑作品');
    },
    
    save() {
        const form = document.getElementById('photo-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const photoData = {
            id: this.editingId || utils.generateId(),
            title: document.getElementById('photo-title').value,
            category: document.getElementById('photo-category').value,
            thumbnail: document.getElementById('photo-thumbnail').value,
            fullImage: document.getElementById('photo-fullimage').value,
            metadata: {
                description: document.getElementById('photo-description').value,
                camera: document.getElementById('photo-camera').value,
                lens: document.getElementById('photo-lens').value,
                aperture: document.getElementById('photo-aperture').value,
                shutter: document.getElementById('photo-shutter').value,
                iso: document.getElementById('photo-iso').value,
                location: document.getElementById('photo-location').value,
                date: document.getElementById('photo-date').value
            }
        };
        
        if (this.editingId) {
            const index = this.photos.findIndex(p => p.id == this.editingId);
            if (index !== -1) {
                this.photos[index] = photoData;
            }
        } else {
            this.photos.push(photoData);
        }
        
        this.savePhotos();
        this.renderList();
        this.closeModal();
        toast.success(this.editingId ? '作品已更新' : '作品已添加');
    },
    
    delete(id) {
        if (!confirm('确定要删除这个作品吗？')) return;
        
        this.photos = this.photos.filter(p => p.id != id);
        this.savePhotos();
        this.renderList();
        toast.success('作品已删除');
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
    
    exportAll() {
        const data = {
            siteConfig: utils.storage.get(ADMIN_CONFIG.storageKeys.siteConfig, ADMIN_CONFIG.defaultConfig),
            photosData: utils.storage.get(ADMIN_CONFIG.storageKeys.photosData, []),
            exportDate: new Date().toISOString()
        };
        
        // 下载配置文件
        utils.downloadJSON(data, `portfolio-config-${Date.now()}.json`);
        
        // 同时下载为config.json格式（用于替换项目文件）
        utils.downloadJSON(data, 'config.json');
        
        toast.success('配置已导出！请将下载的config.json文件复制到项目的data/目录下');
        
        // 显示提示信息
        this.showExportHint();
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
                <strong>📁 配置文件使用说明：</strong><br>
                1. 下载了 <code>config.json</code> 文件<br>
                2. 将其复制到项目的 <code>data/config.json</code> 路径<br>
                3. 替换原有文件<br>
                4. 刷新首页即可看到更新<br><br>
                <em>提示：导出的配置会同时保存到浏览器本地存储，刷新页面不会丢失。</em>
            </div>
        `;
        
        // 查找或创建提示容器
        let hintContainer = document.getElementById('export-hint-container');
        if (!hintContainer) {
            hintContainer = document.createElement('div');
            hintContainer.id = 'export-hint-container';
            const importExportSection = document.getElementById('import-export');
            if (importExportSection) {
                importExportSection.insertBefore(hintContainer, importExportSection.firstChild);
            }
        }
        
        hintContainer.innerHTML = hintHtml;
        
        // 5秒后自动隐藏
        setTimeout(() => {
            if (hintContainer) {
                hintContainer.innerHTML = '';
            }
        }, 10000);
    },
    
    exportPhotos() {
        const data = {
            photos: utils.storage.get(ADMIN_CONFIG.storageKeys.photosData, []),
            exportDate: new Date().toISOString()
        };
        utils.downloadJSON(data, `portfolio-photos-${Date.now()}.json`);
        toast.success('作品数据已导出');
    },
    
    async import(file) {
        try {
            const data = await utils.readFile(file);
            
            if (data.siteConfig) {
                utils.storage.set(ADMIN_CONFIG.storageKeys.siteConfig, data.siteConfig);
                configManager.config = data.siteConfig;
                configManager.updateForm();
            }
            
            if (data.photos || data.photosData) {
                const photos = data.photos || data.photosData;
                utils.storage.set(ADMIN_CONFIG.storageKeys.photosData, photos);
                photosManager.photos = photos;
                photosManager.renderList();
            }
            
            toast.success('配置已导入');
        } catch (err) {
            toast.error(err.message);
        }
    },
    
    resetAll() {
        if (!confirm('确定要重置所有配置吗？此操作不可撤销！')) return;
        
        utils.remove(ADMIN_CONFIG.storageKeys.siteConfig);
        utils.remove(ADMIN_CONFIG.storageKeys.photosData);
        
        configManager.config = JSON.parse(JSON.stringify(ADMIN_CONFIG.defaultConfig));
        configManager.updateForm();
        
        photosManager.photos = [];
        photosManager.renderList();
        
        toast.success('所有配置已重置');
    },
    
    bindEvents() {
        document.getElementById('btn-export-all').addEventListener('click', () => this.exportAll());
        document.getElementById('btn-export-photos').addEventListener('click', () => this.exportPhotos());
        document.getElementById('btn-reset-all').addEventListener('click', () => this.resetAll());
        
        const uploadArea = document.getElementById('file-upload-area');
        const fileInput = document.getElementById('import-file');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--admin-primary)';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '';
            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith('.json')) {
                this.import(file);
            } else {
                toast.error('请上传JSON文件');
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.import(file);
            }
        });
    }
};

// ============================================
// 初始化
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    toast.init();
    
    if (!accessControl.check()) {
        return;
    }
    
    navigation.init();
    configManager.init();
    photosManager.init();
    importExport.init();
    
    console.log('Admin panel initialized');
});
