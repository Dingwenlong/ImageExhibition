/**
 * 个人摄影作品展示网站 - 主JavaScript文件
 */

// ============================================
// 全局配置
// ============================================

const CONFIG = {
    theme: {
        storageKey: 'portfolio-theme-preference',
        defaultTheme: 'light',
        darkTheme: 'dark'
    },
    gallery: {
        dataPath: 'data/photos.json',
        lazyLoadThreshold: 0.1,
        animationDelay: 100
    },
    scroll: {
        topThreshold: 300,
        smoothScrollOffset: 72
    },
    history: {
        storageKey: 'portfolio-view-history',
        maxItems: 20
    },
    admin: {
        siteConfigKey: 'portfolio-site-config',
        photosDataKey: 'portfolio-photos-data'
    }
};

let supportsWebP = false;

function checkWebPSupport() {
    return new Promise((resolve) => {
        const webP = new Image();
        webP.onload = webP.onerror = function() {
            supportsWebP = (webP.height === 2);
            resolve(supportsWebP);
        };
        webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
}

// ============================================
// 工具函数
// ============================================

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function}
 */
function debounce(func, wait = 100) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 节流函数
 * @param {Function} func - 要执行的函数
 * @param {number} limit - 限制时间（毫秒）
 * @returns {Function}
 */
function throttle(func, limit = 100) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 本地存储操作
 */
const storage = {
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn('localStorage get error:', e);
            return defaultValue;
        }
    },
    
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn('localStorage set error:', e);
            return false;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.warn('localStorage remove error:', e);
            return false;
        }
    }
};

// ============================================
// 主题管理模块
// ============================================

const themeManager = {
    currentTheme: CONFIG.theme.defaultTheme,
    
    /**
     * 初始化主题
     */
    init() {
        // 检查本地存储的主题偏好
        const savedTheme = storage.get(CONFIG.theme.storageKey);
        
        // 检查系统偏好
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // 确定初始主题
        if (savedTheme) {
            this.currentTheme = savedTheme;
        } else if (systemPrefersDark) {
            this.currentTheme = CONFIG.theme.darkTheme;
        }
        
        // 应用主题
        this.applyTheme(this.currentTheme);
        
        // 绑定切换按钮事件
        this.bindToggleEvent();
        
        // 监听系统主题变化
        this.watchSystemThemeChange();
        
        console.log(`Theme initialized: ${this.currentTheme}`);
    },
    
    /**
     * 应用主题
     * @param {string} theme - 主题名称
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        
        // 更新按钮状态
        this.updateToggleButton(theme);
    },
    
    /**
     * 切换主题
     */
    toggleTheme() {
        const newTheme = this.currentTheme === CONFIG.theme.darkTheme 
            ? CONFIG.theme.defaultTheme 
            : CONFIG.theme.darkTheme;
        
        this.applyTheme(newTheme);
        storage.set(CONFIG.theme.storageKey, newTheme);
        
        console.log(`Theme switched to: ${newTheme}`);
    },
    
    /**
     * 绑定切换按钮事件
     */
    bindToggleEvent() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleTheme());
        }
    },
    
    /**
     * 更新切换按钮状态
     * @param {string} theme - 当前主题
     */
    updateToggleButton(theme) {
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            const isDark = theme === CONFIG.theme.darkTheme;
            toggleBtn.setAttribute('aria-pressed', isDark);
            toggleBtn.setAttribute('title', isDark ? '切换到亮色模式' : '切换到暗黑模式');
        }
    },
    
    /**
     * 监听系统主题变化
     */
    watchSystemThemeChange() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        mediaQuery.addEventListener('change', (e) => {
            // 仅在用户未手动设置主题时跟随系统
            if (!storage.get(CONFIG.theme.storageKey)) {
                const newTheme = e.matches ? CONFIG.theme.darkTheme : CONFIG.theme.defaultTheme;
                this.applyTheme(newTheme);
            }
        });
    }
};

// ============================================
// 导航模块
// ============================================

const navigation = {
    header: null,
    menuToggle: null,
    mobileNav: null,
    mobileNavOverlay: null,
    mobileNavClose: null,
    
    /**
     * 初始化导航
     */
    init() {
        this.header = document.getElementById('site-header');
        this.menuToggle = document.getElementById('menu-toggle');
        this.mobileNav = document.getElementById('mobile-nav');
        this.mobileNavOverlay = document.getElementById('mobile-nav-overlay');
        this.mobileNavClose = document.getElementById('mobile-nav-close');
        
        if (!this.header) return;
        
        // 使用 IntersectionObserver 监听首屏可见性
        this.initHeroObserver();
        
        // 移动端菜单
        if (this.menuToggle && this.mobileNav) {
            this.bindMobileMenuEvents();
        }
        
        // 平滑滚动
        this.bindSmoothScroll();
        
        // 更新导航链接激活状态
        this.updateActiveNavLink();
        window.addEventListener('scroll', throttle(() => this.updateActiveNavLink(), 100));
    },
    
    /**
     * 使用 IntersectionObserver 监听首屏
     */
    initHeroObserver() {
        const heroSection = document.getElementById('home');
        if (!heroSection) return;
        
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // 首屏可见，导航栏透明
                        this.header.classList.remove('scrolled');
                    } else {
                        // 首屏不可见，导航栏显示背景
                        this.header.classList.add('scrolled');
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '-50px 0px 0px 0px'
            }
        );
        
        observer.observe(heroSection);
    },
    
    /**
     * 绑定移动端菜单事件
     */
    bindMobileMenuEvents() {
        // 打开菜单
        this.menuToggle.addEventListener('click', () => {
            this.openMobileNav();
        });
        
        // 关闭菜单 - 点击关闭按钮
        if (this.mobileNavClose) {
            this.mobileNavClose.addEventListener('click', () => {
                this.closeMobileNav();
            });
        }
        
        // 关闭菜单 - 点击遮罩层
        if (this.mobileNavOverlay) {
            this.mobileNavOverlay.addEventListener('click', () => {
                this.closeMobileNav();
            });
        }
        
        // 点击导航链接关闭菜单
        const mobileNavLinks = this.mobileNav.querySelectorAll('.mobile-nav-link');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.closeMobileNav();
            });
        });
        
        // ESC键关闭菜单
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.mobileNav.classList.contains('active')) {
                this.closeMobileNav();
            }
        });
    },
    
    /**
     * 打开移动端导航
     */
    openMobileNav() {
        this.menuToggle.setAttribute('aria-expanded', 'true');
        this.mobileNav.classList.add('active');
        this.mobileNav.setAttribute('aria-hidden', 'false');
        
        if (this.mobileNavOverlay) {
            this.mobileNavOverlay.classList.add('active');
        }
        
        // 禁止背景滚动
        document.body.style.overflow = 'hidden';
    },
    
    /**
     * 关闭移动端导航
     */
    closeMobileNav() {
        this.menuToggle.setAttribute('aria-expanded', 'false');
        this.mobileNav.classList.remove('active');
        this.mobileNav.setAttribute('aria-hidden', 'true');
        
        if (this.mobileNavOverlay) {
            this.mobileNavOverlay.classList.remove('active');
        }
        
        // 恢复背景滚动
        document.body.style.overflow = '';
    },
    
    /**
     * 绑定平滑滚动
     */
    bindSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const target = document.querySelector(targetId);
                
                if (target) {
                    const headerHeight = document.querySelector('.site-header').offsetHeight;
                    const offsetTop = target.offsetTop - headerHeight;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    },
    
    /**
     * 更新导航链接激活状态
     */
    updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
        
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }
};

// ============================================
// 回到顶部模块
// ============================================

const backToTop = {
    button: null,
    
    /**
     * 初始化
     */
    init() {
        this.button = document.getElementById('back-to-top');
        if (!this.button) return;
        
        window.addEventListener('scroll', throttle(() => this.handleScroll(), 100));
        this.button.addEventListener('click', () => this.scrollToTop());
    },
    
    /**
     * 处理滚动
     */
    handleScroll() {
        if (window.scrollY > CONFIG.scroll.topThreshold) {
            this.button.classList.add('visible');
        } else {
            this.button.classList.remove('visible');
        }
    },
    
    /**
     * 回到顶部
     */
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
};

// ============================================
// 画廊模块
// ============================================

const gallery = {
    grid: null,
    filterButtons: null,
    photosData: [],
    currentFilter: 'all',
    
    async init() {
        this.grid = document.getElementById('gallery-grid');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        
        if (!this.grid) return;
        
        try {
            await checkWebPSupport();
            
            await this.loadPhotos();
            
            this.renderPhotos();
            
            this.bindFilterEvents();
            
            this.showRecentlyViewed();
            
            console.log(`Gallery initialized with ${this.photosData.length} photos, WebP: ${supportsWebP}`);
        } catch (error) {
            console.error('Failed to initialize gallery:', error);
            this.showError('加载作品数据失败，请稍后重试');
        }
    },
    
    async loadPhotos() {
        // 优先级：config.json > localStorage > photos.json > 默认数据
        
        // 1. 尝试从config.json读取
        try {
            const configResponse = await fetch('data/config.json');
            if (configResponse.ok) {
                const configData = await configResponse.json();
                if (configData.photosData && configData.photosData.length > 0) {
                    this.photosData = configData.photosData;
                    console.log('Loaded photos from config.json');
                    return;
                }
            }
        } catch (e) {
            console.log('No photos in config.json');
        }
        
        // 2. 尝试从localStorage读取
        const adminPhotos = storage.get(CONFIG.admin.photosDataKey, []);
        if (adminPhotos.length > 0) {
            this.photosData = adminPhotos;
            console.log('Loaded photos from admin config (localStorage)');
            return;
        }
        
        // 3. 从photos.json读取
        try {
            const response = await fetch(CONFIG.gallery.dataPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.photosData = data.photos || [];
            console.log('Loaded photos from photos.json');
        } catch (error) {
            console.error('Error loading photos:', error);
            this.photosData = this.getDefaultPhotos();
        }
    },
    
    getDefaultPhotos() {
        return [
            {
                id: 1,
                title: "晨光中的少女",
                category: "portrait",
                thumbnail: "https://via.placeholder.com/400x300/667eea/ffffff?text=Portrait+1",
                fullImage: "https://via.placeholder.com/1200x800/667eea/ffffff?text=Portrait+1",
                metadata: {
                    camera: "Sony A7R IV",
                    lens: "85mm f/1.4 GM",
                    aperture: "f/1.8",
                    shutter: "1/250s",
                    iso: "100",
                    location: "杭州西湖",
                    date: "2024-03-15",
                    description: "清晨的柔和光线勾勒出模特优雅的轮廓，大光圈营造出梦幻般的背景虚化效果。"
                }
            },
            {
                id: 2,
                title: "黄山云海",
                category: "landscape",
                thumbnail: "https://via.placeholder.com/400x300/764ba2/ffffff?text=Landscape+1",
                fullImage: "https://via.placeholder.com/1200x800/764ba2/ffffff?text=Landscape+1",
                metadata: {
                    camera: "Sony A7R IV",
                    lens: "16-35mm f/2.8 GM",
                    aperture: "f/11",
                    shutter: "1/60s",
                    iso: "200",
                    location: "安徽黄山",
                    date: "2024-02-20",
                    description: "日出时分，云海翻涌，金色的阳光穿透云层，照亮了远处的山峰。"
                }
            },
            {
                id: 3,
                title: "老街手艺人",
                category: "documentary",
                thumbnail: "https://via.placeholder.com/400x300/f093fb/ffffff?text=Documentary+1",
                fullImage: "https://via.placeholder.com/1200x800/f093fb/ffffff?text=Documentary+1",
                metadata: {
                    camera: "Fujifilm X-T4",
                    lens: "35mm f/1.4",
                    aperture: "f/2.8",
                    shutter: "1/125s",
                    iso: "400",
                    location: "苏州平江路",
                    date: "2024-01-10",
                    description: "记录传统手工艺人的专注神情，展现匠人精神的传承与坚守。"
                }
            },
            {
                id: 4,
                title: "城市几何",
                category: "blackwhite",
                thumbnail: "https://via.placeholder.com/400x300/333333/ffffff?text=B&W+1",
                fullImage: "https://via.placeholder.com/1200x800/333333/ffffff?text=B&W+1",
                metadata: {
                    camera: "Leica M10",
                    lens: "50mm f/2",
                    aperture: "f/8",
                    shutter: "1/500s",
                    iso: "100",
                    location: "上海陆家嘴",
                    date: "2024-03-01",
                    description: "通过黑白影调强调建筑的线条与几何美感，展现都市的冷峻与现代感。"
                }
            }
        ];
    },
    
    renderPhotos(animate = true) {
        if (!this.photosData.length) {
            this.grid.innerHTML = '<p class="text-center text-muted" style="grid-column: 1/-1; text-align: center; padding: 2rem;">暂无作品数据</p>';
            return;
        }
        
        const filteredPhotos = this.currentFilter === 'all'
            ? this.photosData
            : this.photosData.filter(photo => photo.category === this.currentFilter);
        
        if (animate) {
            this.grid.classList.add('filtering');
            setTimeout(() => {
                this.grid.innerHTML = filteredPhotos.map((photo, index) => this.createPhotoCard(photo, index)).join('');
                this.bindPhotoCardEvents();
                this.initLazyLoad();
                this.grid.classList.remove('filtering');
            }, 200);
        } else {
            this.grid.innerHTML = filteredPhotos.map((photo, index) => this.createPhotoCard(photo, index)).join('');
            this.bindPhotoCardEvents();
            this.initLazyLoad();
        }
    },
    
    createPhotoCard(photo, index) {
        const categoryLabels = {
            portrait: '人像',
            landscape: '风光',
            documentary: '纪实',
            blackwhite: '黑白'
        };
        
        const webpThumbnail = photo.webpThumbnail || photo.thumbnail.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        const webpFull = photo.webpFull || photo.fullImage.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        
        const useWebP = supportsWebP && (photo.webpThumbnail || photo.webpFull);
        
        const thumbnailSrc = useWebP ? webpThumbnail : photo.thumbnail;
        const blurThumbnail = photo.blurThumbnail || '';
        
        return `
            <article class="gallery-item" data-id="${photo.id}" data-category="${photo.category}" style="animation-delay: ${index * CONFIG.gallery.animationDelay}ms">
                <picture class="gallery-item-picture">
                    ${useWebP ? `<source srcset="${webpThumbnail}" type="image/webp">` : ''}
                    <img src="${thumbnailSrc}" 
                         alt="${photo.title}" 
                         class="gallery-item-image ${blurThumbnail ? 'progressive' : ''}"
                         loading="lazy"
                         decoding="async"
                         ${blurThumbnail ? `data-blur="${blurThumbnail}"` : ''}>
                </picture>
                <div class="gallery-item-overlay">
                    <h3 class="gallery-item-title">${photo.title}</h3>
                    <span class="gallery-item-category">${categoryLabels[photo.category] || photo.category}</span>
                </div>
            </article>
        `;
    },
    
    bindPhotoCardEvents() {
        const items = this.grid.querySelectorAll('.gallery-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const photoId = parseInt(item.dataset.id);
                lightbox.open(photoId);
            });
        });
    },
    
    bindFilterEvents() {
        this.filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.filterButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-pressed', 'false');
                });
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');
                
                this.currentFilter = button.dataset.filter;
                
                this.saveFilterPreference(this.currentFilter);
                
                this.renderPhotos(true);
            });
        });
    },
    
    initLazyLoad() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.classList.add('loaded');
                        
                        const blurSrc = img.dataset.blur;
                        if (blurSrc && !img.dataset.blurLoaded) {
                            img.style.filter = 'blur(10px)';
                            img.src = blurSrc;
                            img.dataset.blurLoaded = 'true';
                            
                            const hdImg = new Image();
                            hdImg.onload = () => {
                                img.src = img.dataset.hdSrc || img.src;
                                img.style.filter = 'blur(0)';
                                img.style.transition = 'filter 0.3s ease';
                            };
                            hdImg.src = img.src;
                        }
                        
                        imageObserver.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px',
                threshold: CONFIG.gallery.lazyLoadThreshold
            });
            
            this.grid.querySelectorAll('img[loading="lazy"]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    },
    
    showError(message) {
        this.grid.innerHTML = `<p class="text-center text-muted" style="grid-column: 1/-1; text-align: center; padding: 2rem;">${message}</p>`;
    },
    
    getPhotoById(id) {
        return this.photosData.find(photo => photo.id === id) || null;
    },
    
    getFilteredPhotos() {
        return this.currentFilter === 'all'
            ? this.photosData
            : this.photosData.filter(photo => photo.category === this.currentFilter);
    },
    
    saveFilterPreference(filter) {
        storage.set('portfolio-last-filter', filter);
    },
    
    getFilterPreference() {
        return storage.get('portfolio-last-filter', 'all');
    },
    
    showRecentlyViewed() {
        const history = storage.get(CONFIG.history.storageKey, []);
        if (history.length > 0) {
            console.log(`Recently viewed: ${history.slice(0, 5).join(', ')}`);
        }
    }
};

// ============================================
// 灯箱模块
// ============================================

const lightbox = {
    element: null,
    backdrop: null,
    image: null,
    imageContainer: null,
    title: null,
    meta: null,
    description: null,
    current: null,
    total: null,
    currentPhotoId: null,
    filteredPhotos: [],
    currentIndex: 0,
    loadingIndicator: null,
    shareBtn: null,
    
    pinchState: {
        isPinching: false,
        startDistance: 0,
        currentScale: 1,
        startScale: 1
    },
    
    panState: {
        isPanning: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0
    },
    
    config: {
        minScale: 0.5,
        maxScale: 3,
        doubleTapScale: 2,
        bounceBackDuration: 300
    },
    
    init() {
        this.element = document.getElementById('lightbox');
        if (!this.element) return;
        
        this.backdrop = this.element.querySelector('.lightbox-backdrop');
        this.image = document.getElementById('lightbox-image');
        this.imageContainer = this.element.querySelector('.lightbox-image-container');
        this.title = document.getElementById('lightbox-title');
        this.meta = document.getElementById('lightbox-meta');
        this.description = document.getElementById('lightbox-description');
        this.current = document.getElementById('lightbox-current');
        this.total = document.getElementById('lightbox-total');
        this.loadingIndicator = document.getElementById('lightbox-loading');
        this.shareBtn = document.getElementById('lightbox-share');
        
        document.getElementById('lightbox-close').addEventListener('click', () => this.close());
        this.backdrop.addEventListener('click', () => this.close());
        
        document.getElementById('lightbox-prev').addEventListener('click', () => this.prev());
        document.getElementById('lightbox-next').addEventListener('click', () => this.next());
        
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        this.bindTouchEvents();
        this.bindPinchZoom();
        this.bindShareButton();
    },
    
    open(photoId) {
        this.currentPhotoId = photoId;
        this.filteredPhotos = gallery.getFilteredPhotos();
        this.currentIndex = this.filteredPhotos.findIndex(p => p.id === photoId);
        
        if (this.currentIndex === -1) return;
        
        this.resetZoom();
        this.updateContent();
        this.element.hidden = false;
        document.body.style.overflow = 'hidden';
        
        if (this.total) {
            this.total.textContent = this.filteredPhotos.length;
        }
        
        this.recordViewHistory(photoId);
    },
    
    close() {
        this.element.hidden = true;
        document.body.style.overflow = '';
        this.resetZoom();
    },
    
    updateContent() {
        const photo = this.filteredPhotos[this.currentIndex];
        if (!photo) return;
        
        this.showLoading();
        this.resetZoom();
        
        this.image.onload = () => this.hideLoading();
        this.image.onerror = () => this.hideLoading();
        
        this.image.src = photo.fullImage;
        this.image.alt = photo.title;
        this.title.textContent = photo.title;
        this.current.textContent = this.currentIndex + 1;
        
        const metaText = `${photo.metadata.camera} · ${photo.metadata.lens} · ${photo.metadata.aperture} · ${photo.metadata.shutter} · ISO ${photo.metadata.iso}`;
        this.meta.textContent = metaText;
        
        this.description.textContent = photo.metadata.description;
        
        this.preloadAdjacentImages();
    },
    
    showLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.hidden = false;
        }
    },
    
    hideLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.hidden = true;
        }
    },
    
    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.filteredPhotos.length) % this.filteredPhotos.length;
        this.updateContent();
    },
    
    next() {
        this.currentIndex = (this.currentIndex + 1) % this.filteredPhotos.length;
        this.updateContent();
    },
    
    handleKeydown(e) {
        if (this.element.hidden) return;
        
        switch (e.key) {
            case 'Escape':
                this.close();
                break;
            case 'ArrowLeft':
                this.prev();
                break;
            case 'ArrowRight':
                this.next();
                break;
            case '0':
                this.resetZoom();
                break;
        }
    },
    
    bindTouchEvents() {
        let touchStartX = 0;
        let touchEndX = 0;
        let touchStartTime = 0;
        
        this.element.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].screenX;
                touchStartTime = Date.now();
            }
        }, { passive: true });
        
        this.element.addEventListener('touchend', (e) => {
            if (this.pinchState.isPinching) return;
            
            touchEndX = e.changedTouches[0].screenX;
            const touchDuration = Date.now() - touchStartTime;
            const diff = touchStartX - touchEndX;
            
            if (touchDuration < 300 && Math.abs(diff) < 10) {
                return;
            }
            
            if (this.pinchState.currentScale <= 1.1) {
                this.handleSwipe(touchStartX, touchEndX);
            }
        }, { passive: true });
    },
    
    handleSwipe(startX, endX) {
        const threshold = 50;
        const diff = startX - endX;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                this.next();
            } else {
                this.prev();
            }
        }
    },
    
    bindPinchZoom() {
        const container = this.imageContainer;
        if (!container) return;
        
        container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                this.pinchState.isPinching = true;
                this.pinchState.startDistance = this.getTouchDistance(e.touches);
                this.pinchState.startScale = this.pinchState.currentScale;
                this.image.style.transition = 'none';
            } else if (e.touches.length === 1 && this.pinchState.currentScale > 1) {
                this.panState.isPanning = true;
                this.panState.startX = e.touches[0].clientX - this.panState.currentX;
                this.panState.startY = e.touches[0].clientY - this.panState.currentY;
                this.image.style.transition = 'none';
            }
        }, { passive: false });
        
        container.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && this.pinchState.isPinching) {
                e.preventDefault();
                const currentDistance = this.getTouchDistance(e.touches);
                const scale = (currentDistance / this.pinchState.startDistance) * this.pinchState.startScale;
                
                this.pinchState.currentScale = Math.min(Math.max(scale, this.config.minScale), this.config.maxScale);
                this.applyTransform();
            } else if (e.touches.length === 1 && this.panState.isPanning && this.pinchState.currentScale > 1) {
                e.preventDefault();
                this.panState.currentX = e.touches[0].clientX - this.panState.startX;
                this.panState.currentY = e.touches[0].clientY - this.panState.startY;
                this.applyTransform();
            }
        }, { passive: false });
        
        container.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) {
                this.pinchState.isPinching = false;
            }
            if (e.touches.length === 0) {
                this.panState.isPanning = false;
                
                if (this.pinchState.currentScale < 1) {
                    this.bounceBack(1);
                } else if (this.pinchState.currentScale > this.config.maxScale) {
                    this.bounceBack(this.config.maxScale);
                }
            }
        }, { passive: true });
        
        container.addEventListener('dblclick', (e) => {
            e.preventDefault();
            if (this.pinchState.currentScale > 1.1) {
                this.bounceBack(1);
            } else {
                this.bounceBack(this.config.doubleTapScale);
                const rect = this.image.getBoundingClientRect();
                const centerX = e.clientX - rect.left - rect.width / 2;
                const centerY = e.clientY - rect.top - rect.height / 2;
                this.panState.currentX = -centerX;
                this.panState.currentY = -centerY;
                this.applyTransform();
            }
        });
        
        container.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                const newScale = this.pinchState.currentScale * delta;
                this.pinchState.currentScale = Math.min(Math.max(newScale, this.config.minScale), this.config.maxScale);
                this.image.style.transition = 'transform 0.1s ease';
                this.applyTransform();
            }
        }, { passive: false });
    },
    
    getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    },
    
    applyTransform() {
        const scale = this.pinchState.currentScale;
        const x = this.panState.currentX;
        const y = this.panState.currentY;
        this.image.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    },
    
    bounceBack(targetScale) {
        this.image.style.transition = `transform ${this.config.bounceBackDuration}ms ease`;
        this.pinchState.currentScale = targetScale;
        
        if (targetScale === 1) {
            this.panState.currentX = 0;
            this.panState.currentY = 0;
        }
        
        this.applyTransform();
    },
    
    resetZoom() {
        this.pinchState.currentScale = 1;
        this.pinchState.startScale = 1;
        this.pinchState.isPinching = false;
        this.panState.currentX = 0;
        this.panState.currentY = 0;
        this.panState.isPanning = false;
        
        if (this.image) {
            this.image.style.transition = 'none';
            this.image.style.transform = 'translate(0, 0) scale(1)';
        }
    },
    
    preloadAdjacentImages() {
        const prevIndex = (this.currentIndex - 1 + this.filteredPhotos.length) % this.filteredPhotos.length;
        const nextIndex = (this.currentIndex + 1) % this.filteredPhotos.length;
        
        [prevIndex, nextIndex].forEach(index => {
            const photo = this.filteredPhotos[index];
            if (photo && photo.fullImage) {
                const img = new Image();
                img.src = photo.fullImage;
            }
        });
    },
    
    bindShareButton() {
        if (this.shareBtn) {
            this.shareBtn.addEventListener('click', () => this.shareCurrentPhoto());
        }
    },
    
    async shareCurrentPhoto() {
        const photo = this.filteredPhotos[this.currentIndex];
        if (!photo) return;
        
        const shareData = {
            title: photo.title,
            text: photo.metadata.description,
            url: window.location.href
        };
        
        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    this.fallbackShare();
                }
            }
        } else {
            this.fallbackShare();
        }
    },
    
    fallbackShare() {
        const url = window.location.href;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                alert('链接已复制到剪贴板');
            }).catch(() => {
                this.showCopyPrompt(url);
            });
        } else {
            this.showCopyPrompt(url);
        }
    },
    
    showCopyPrompt(url) {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        alert('链接已复制到剪贴板');
    },
    
    recordViewHistory(photoId) {
        const historyKey = 'portfolio-view-history';
        let history = storage.get(historyKey, []);
        
        history = history.filter(id => id !== photoId);
        history.unshift(photoId);
        history = history.slice(0, 20);
        
        storage.set(historyKey, history);
    }
};

// ============================================
// 表单验证模块
// ============================================

const formValidation = {
    /**
     * 初始化表单验证
     */
    init() {
        const form = document.getElementById('contact-form');
        if (!form) return;
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (this.validateForm(form)) {
                this.handleSubmit(form);
            }
        });
    },
    
    /**
     * 验证表单
     * @param {HTMLFormElement} form - 表单元素
     * @returns {boolean}
     */
    validateForm(form) {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        
        // 清除之前的错误
        form.querySelectorAll('.error-message').forEach(el => el.remove());
        form.querySelectorAll('[aria-invalid]').forEach(el => {
            el.removeAttribute('aria-invalid');
            el.style.borderColor = '';
        });
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                this.showFieldError(field, '此字段为必填项');
            } else if (field.type === 'email' && !this.isValidEmail(field.value)) {
                isValid = false;
                this.showFieldError(field, '请输入有效的邮箱地址');
            } else if (field.name === 'message' && field.value.trim().length < 10) {
                isValid = false;
                this.showFieldError(field, '留言内容至少需要10个字符');
            }
        });
        
        return isValid;
    },
    
    /**
     * 验证邮箱格式
     * @param {string} email - 邮箱地址
     * @returns {boolean}
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    /**
     * 显示字段错误
     * @param {HTMLElement} field - 表单字段
     * @param {string} message - 错误信息
     */
    showFieldError(field, message) {
        field.setAttribute('aria-invalid', 'true');
        field.style.borderColor = '#e53e3e';
        
        const errorElement = document.createElement('span');
        errorElement.className = 'error-message';
        errorElement.style.cssText = 'color: #e53e3e; font-size: 0.875rem; margin-top: 0.25rem; display: block;';
        errorElement.textContent = message;
        
        field.parentElement.appendChild(errorElement);
    },
    
    /**
     * 处理表单提交
     * @param {HTMLFormElement} form - 表单元素
     */
    handleSubmit(form) {
        const submitBtn = form.querySelector('.submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        // 显示加载状态
        submitBtn.disabled = true;
        btnText.hidden = true;
        btnLoading.hidden = false;
        
        // 模拟提交
        setTimeout(() => {
            alert('消息已发送成功！我们会尽快回复您。');
            form.reset();
            
            // 恢复按钮状态
            submitBtn.disabled = false;
            btnText.hidden = false;
            btnLoading.hidden = true;
        }, 1500);
    }
};

// ============================================
// 滚动动画模块
// ============================================

const scrollAnimation = {
    /**
     * 初始化滚动动画
     */
    init() {
        if (!('IntersectionObserver' in window)) return;
        
        const animatedElements = document.querySelectorAll('.section-header, .about-content, .contact-container');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
        
        // 添加动画完成后的样式
        const style = document.createElement('style');
        style.textContent = `
            .animate-in {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }
        `;
        document.head.appendChild(style);
    }
};

// ============================================
// 应用初始化
// ============================================

/**
 * DOMContentLoaded 事件处理
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing Portfolio App');
    
    siteConfig.init();
    
    themeManager.init();
    navigation.init();
    backToTop.init();
    gallery.init();
    lightbox.init();
    formValidation.init();
    scrollAnimation.init();
    
    console.log('Portfolio App initialized successfully');
});

// ============================================
// 全局错误处理
// ============================================

window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});

// ============================================
// 站点配置管理（从Admin/配置文件读取）
// ============================================

const siteConfig = {
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
    },
    
    config: null,
    fileConfig: null,
    
    async init() {
        await this.loadConfig();
        this.applyConfig();
        console.log('Site config loaded');
    },
    
    async loadConfig() {
        // 优先尝试从配置文件读取
        try {
            const response = await fetch('data/config.json');
            if (response.ok) {
                const data = await response.json();
                if (data.siteConfig) {
                    this.fileConfig = data.siteConfig;
                    console.log('Config loaded from file: data/config.json');
                }
            }
        } catch (e) {
            console.log('No config file found, using localStorage or defaults');
        }
        
        // 合并配置优先级：文件配置 > localStorage > 默认配置
        const localConfig = storage.get(CONFIG.admin.siteConfigKey, null);
        
        if (this.fileConfig) {
            // 如果有文件配置，优先使用，但localStorage可以覆盖部分设置
            this.config = this.mergeConfig(this.defaultConfig, this.fileConfig, localConfig);
        } else if (localConfig) {
            // 没有文件配置，使用localStorage
            this.config = { ...this.defaultConfig, ...localConfig };
        } else {
            // 都没有，使用默认配置
            this.config = { ...this.defaultConfig };
        }
    },
    
    mergeConfig(defaults, file, local) {
        const merged = { ...defaults };
        
        // 文件配置覆盖默认配置
        if (file) {
            Object.keys(file).forEach(key => {
                if (typeof file[key] === 'object' && file[key] !== null && !Array.isArray(file[key])) {
                    merged[key] = { ...defaults[key], ...file[key] };
                } else {
                    merged[key] = file[key];
                }
            });
        }
        
        // localStorage配置覆盖文件配置（允许用户本地自定义）
        if (local) {
            Object.keys(local).forEach(key => {
                if (typeof local[key] === 'object' && local[key] !== null && !Array.isArray(local[key])) {
                    merged[key] = { ...merged[key], ...local[key] };
                } else {
                    merged[key] = local[key];
                }
            });
        }
        
        return merged;
    },
    
    applyConfig() {
        this.applyHeroConfig();
        this.applyBrandConfig();
        this.applyThemeConfig();
    },
    
    applyHeroConfig() {
        const { hero, buttons } = this.config;
        
        const titleLine1 = document.getElementById('hero-title-line1');
        const titleLine2 = document.getElementById('hero-title-line2');
        const subtitle = document.getElementById('hero-subtitle');
        const description = document.getElementById('hero-description');
        const btnPrimary = document.getElementById('hero-btn-primary');
        const btnSecondary = document.getElementById('hero-btn-secondary');
        
        if (titleLine1) titleLine1.textContent = hero.titleLine1;
        if (titleLine2) titleLine2.textContent = hero.titleLine2;
        if (subtitle) subtitle.textContent = hero.subtitle;
        if (description) description.innerHTML = hero.description.replace(/\n/g, '<br>');
        
        if (btnPrimary) {
            btnPrimary.textContent = buttons.primary.text;
            btnPrimary.href = buttons.primary.link;
        }
        if (btnSecondary) {
            btnSecondary.textContent = buttons.secondary.text;
            btnSecondary.href = buttons.secondary.link;
        }
    },
    
    applyBrandConfig() {
        const { brand } = this.config;
        
        const brandName = document.getElementById('brand-name');
        const footerCopyright = document.getElementById('footer-copyright');
        
        if (brandName) brandName.textContent = brand.name;
        if (footerCopyright) footerCopyright.textContent = brand.copyright;
        
        document.title = `${brand.name} | 个人摄影作品展示`;
    },
    
    applyThemeConfig() {
        const { theme } = this.config;
        
        const root = document.documentElement;
        
        root.style.setProperty('--color-accent', theme.accentColor);
        root.style.setProperty('--color-accent-hover', theme.accentHover);
        
        const heroBg = document.querySelector('.hero-background');
        if (heroBg) {
            if (theme.bgType === 'image' && theme.bgImage) {
                heroBg.innerHTML = `<img src="${theme.bgImage}" alt="" class="hero-bg-image">`;
            } else {
                const gradient = theme.gradient;
                const svg = heroBg.querySelector('svg');
                if (svg) {
                    const stops = svg.querySelectorAll('stop');
                    if (stops.length >= 3) {
                        stops[0].style.stopColor = gradient.start;
                        stops[1].style.stopColor = gradient.mid;
                        stops[2].style.stopColor = gradient.end;
                    }
                }
            }
        }
        
        const darkStyles = `
            [data-theme="dark"] {
                --color-bg-primary: ${theme.dark.bgPrimary};
                --color-text-primary: ${theme.dark.textPrimary};
            }
            @media (prefers-color-scheme: dark) {
                :root:not([data-theme="light"]) {
                    --color-bg-primary: ${theme.dark.bgPrimary};
                    --color-text-primary: ${theme.dark.textPrimary};
                }
            }
        `;
        
        let styleEl = document.getElementById('dynamic-theme-styles');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'dynamic-theme-styles';
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = darkStyles;
    }
};
