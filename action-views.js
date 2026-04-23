const ActionViews = {
    createNav(title, onClose) {
        const nav = document.createElement('div');
        nav.className = 'st-nav';
        nav.innerHTML = `<h2 class="st-title">${title}</h2><button class="st-close" type="button">&times;</button>`;
        nav.querySelector('.st-close').onclick = onClose || (() => Modal.close());
        return nav;
    },
    createShell(title) {
        const root = document.createElement('div');
        root.className = 'st-layout';
        root.style.cssText = 'display:flex;flex-direction:column;flex:1;min-height:0;position:relative';
        root.appendChild(this.createNav(title));
        const body = document.createElement('div');
        body.className = 'st-scroll-area';
        root.appendChild(body);

        // 添加回到顶部按钮
        const backToTop = document.createElement('button');
        backToTop.className = 'modal-back-to-top';
        backToTop.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>';
        backToTop.onclick = () => body.scrollTo({ top: 0, behavior: 'smooth' });
        root.appendChild(backToTop);

        // 监听滚动显示/隐藏按钮
        const toggleBtn = () => {
            if (body.scrollTop > 100) {
                backToTop.classList.add('is-visible');
            } else {
                backToTop.classList.remove('is-visible');
            }
        };
        body.addEventListener('scroll', toggleBtn, { passive: true });
        toggleBtn();

        return { root, body };
    },
    createPageLayout(title) { return this.createShell(title); },

    createSkeletonCard(lineWidths = ['72%', '48%', '88%'], className = '') {
        const card = document.createElement('div');
        card.className = `modal-skeleton-card${className ? ` ${className}` : ''}`;
        lineWidths.forEach(width => {
            const line = document.createElement('div');
            line.className = 'modal-skeleton-line';
            line.style.width = typeof width === 'number' ? `${width}px` : width;
            card.appendChild(line);
        });
        return card;
    },

    createSkeletonPill(width = '96px') {
        const pill = document.createElement('span');
        pill.className = 'modal-skeleton-pill';
        pill.style.width = typeof width === 'number' ? `${width}px` : width;
        return pill;
    },

    createSkeletonChip(width = '80px') {
        const chip = document.createElement('span');
        chip.className = 'modal-skeleton-chip';
        chip.style.width = typeof width === 'number' ? `${width}px` : width;
        return chip;
    },

    createColorPanel(selected) {
        const panel = document.createElement('div');
        panel.className = 'color-panel';
        panel.innerHTML = `<section class="color-preview-card">
                <div class="color-preview-label">已登记卡片预览</div>
                <div class="color-preview">ABC 123</div>
            </section>
            <section class="color-group">
                <div class="color-group-title">预设颜色</div>
                <div class="color-presets"></div>
            </section>
            <section class="color-group">
                <div class="color-group-title">自定义颜色</div>
                <div class="color-picker-row"><input type="color" value="${selected}" aria-label="自定义卡片颜色"><span class="color-code">${selected}</span></div>
            </section>
            <div class="color-note">颜色会立即用于已登记学生卡片，并写入本地存储；导出备份时也会一起带上。</div>`;
        return {
            panel,
            preview: panel.querySelector('.color-preview'),
            presetHost: panel.querySelector('.color-presets'),
            picker: panel.querySelector('input[type="color"]'),
            code: panel.querySelector('.color-code')
        };
    },

    createColorShell(selected) {
        const { root, body } = this.createShell('卡片颜色');
        body.style.padding = '16px';
        const color = this.createColorPanel(selected);
        body.appendChild(color.panel);
        return { root, body, ...color };
    },

    createAsgManageShell() {
        const { root, body } = this.createShell('作业项目管理');
        const introHost = document.createElement('section');
        introHost.className = 'modal-stage-host';
        introHost.appendChild(this.createSkeletonCard(['34%', '76%', '100%'], 'modal-skeleton-card-lg'));
        const list = document.createElement('section');
        list.className = 'asg-manage-grid';
        list.append(
            this.createSkeletonCard(['28%', '56%', '44%']),
            this.createSkeletonCard(['36%', '62%', '46%']),
            this.createSkeletonCard(['32%', '58%', '42%'])
        );
        body.append(introHost, list);
        return {
            root,
            body,
            list,
            introHost
        };
    },

    createAsgManageHero() {
        const section = document.createElement('section');
        section.className = 'asg-manage-hero modal-stage-ready';
        section.innerHTML = `<div class="asg-manage-hero-head">
            <div class="asg-manage-hero-title">新建任务</div>
            <div class="asg-manage-hero-note">在此页完成新增、切换、编辑与删除，统一管理任务。</div>
        </div>
        <div class="asg-manage-form">
            <input class="input-ui" data-role="new-name" placeholder="输入任务名称">
            <button class="btn btn-c" type="button" data-role="new-alt"></button>
            <button class="btn btn-p" type="button" data-role="new-create">创建</button>
        </div>`;
        return {
            section,
            newNameInput: section.querySelector('[data-role="new-name"]'),
            newAltBtn: section.querySelector('[data-role="new-alt"]'),
            newCreateBtn: section.querySelector('[data-role="new-create"]')
        };
    },

    createImportShell() {
        const { root, body } = this.createShell('导入备份');
        body.style.padding = '16px';
        
        const shell = document.createElement('section');
        shell.className = 'import-shell';
        
        // 警告提示区域
        const warningSection = document.createElement('div');
        warningSection.className = 'import-warning';
        warningSection.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span>导入将完全覆盖当前的名单、作业任务和设置数据，请确保备份文件来源可靠。</span>
        `;
        
        // 拖拽上传区域
        const dropZone = document.createElement('div');
        dropZone.className = 'import-dropzone';
        dropZone.innerHTML = `
            <input type="file" data-role="file-input" hidden>
            <div class="import-dropzone-content">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <div class="import-dropzone-text">
                    <strong>点击选择文件</strong>或拖拽文件到此处
                </div>
                <div class="import-dropzone-hint">支持备份文件导入（将自动校验内容）</div>
            </div>
        `;
        
        // 文件信息区域
        const fileInfo = document.createElement('div');
        fileInfo.className = 'import-fileinfo';
        fileInfo.hidden = true;
        fileInfo.innerHTML = `
            <div class="import-fileinfo-header">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span data-role="filename"></span>
                <button class="import-fileinfo-remove" type="button" data-role="remove-file" title="移除文件">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="import-fileinfo-preview" data-role="preview"></div>
        `;
        
        // 状态消息区域
        const statusArea = document.createElement('div');
        statusArea.className = 'import-status';
        statusArea.dataset.role = 'status';
        statusArea.textContent = '请选择备份文件';
        
        // 操作按钮区域
        const actions = document.createElement('div');
        actions.className = 'import-actions';
        actions.innerHTML = `
            <button class="btn btn-c" type="button" data-role="cancel">取消</button>
            <button class="btn btn-p" type="button" data-role="apply" disabled>确认导入</button>
        `;
        
        shell.append(warningSection, dropZone, fileInfo, statusArea, actions);
        body.appendChild(shell);
        
        return {
            root,
            dropZone,
            fileInput: dropZone.querySelector('[data-role="file-input"]'),
            fileInfo,
            fileNameEl: fileInfo.querySelector('[data-role="filename"]'),
            previewEl: fileInfo.querySelector('[data-role="preview"]'),
            removeBtn: fileInfo.querySelector('[data-role="remove-file"]'),
            statusEl: statusArea,
            cancelBtn: actions.querySelector('[data-role="cancel"]'),
            applyBtn: actions.querySelector('[data-role="apply"]')
        };
    },

    createQuizTrendShell() {
        const { root, body } = this.createShell('小测趋势');
        body.style.padding = '16px';
        const shell = document.createElement('section');
        shell.className = 'trend-shell';
        const heroHost = document.createElement('div');
        heroHost.className = 'modal-stage-host';
        heroHost.appendChild(this.createSkeletonCard(['42%', '78%', '36%'], 'modal-skeleton-card-lg'));
        const toolbarHost = document.createElement('div');
        toolbarHost.className = 'modal-stage-host';
        toolbarHost.appendChild(this.createSkeletonCard(['18%', '18%', '18%', '18%'], 'modal-skeleton-card-lg'));
        const assignmentEl = document.createElement('div');
        assignmentEl.className = 'trend-assignment-strip';
        assignmentEl.append(this.createSkeletonChip('88px'), this.createSkeletonChip('88px'), this.createSkeletonChip('104px'));
        const boardEl = document.createElement('div');
        boardEl.className = 'trend-board';
        const listEl = document.createElement('div');
        listEl.className = 'trend-list';
        Array.from({ length: 4 }, () => this.createSkeletonCard(['34%', '56%', '72%', '64%', '48%'], 'modal-skeleton-card-lg')).forEach(card => listEl.appendChild(card));
        boardEl.appendChild(listEl);
        shell.append(heroHost, toolbarHost, assignmentEl, boardEl);
        body.appendChild(shell);
        return {
            root,
            heroHost,
            toolbarHost,
            assignmentEl,
            boardEl,
            listEl
        };
    },

    createQuizTrendChrome() {
        const hero = document.createElement('div');
        hero.className = 'trend-hero trend-hero-summary modal-stage-ready';
        hero.dataset.role = 'summary';
        const toolbar = document.createElement('div');
        toolbar.className = 'trend-toolbar modal-stage-ready';
        toolbar.innerHTML = `<label class="trend-field">
                <span>开始</span>
                <select class="input-ui" data-role="start"></select>
            </label>
            <label class="trend-field">
                <span>结束</span>
                <select class="input-ui" data-role="end"></select>
            </label>
            <label class="trend-field trend-search">
                <span>筛选</span>
                <input class="input-ui" data-role="search" placeholder="输入学号或姓名">
            </label>
            <div class="trend-quick" data-role="quick">
                <button class="btn btn-c" type="button" data-range="recent">最近5次</button>
                <button class="btn btn-c" type="button" data-range="all">全部</button>
            </div>`;
        return {
            hero,
            toolbar,
            summaryEl: hero,
            startEl: toolbar.querySelector('[data-role="start"]'),
            endEl: toolbar.querySelector('[data-role="end"]'),
            searchEl: toolbar.querySelector('[data-role="search"]'),
            quickEl: toolbar.querySelector('[data-role="quick"]')
        };
    },

    createTrendSparkline(entries) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 180 52');
        svg.setAttribute('class', 'trend-sparkline');
        if (!entries.length) {
            svg.innerHTML = '<text x="90" y="30" text-anchor="middle" class="trend-empty-text">暂无分数</text>';
            return svg;
        }
        if (entries.length === 1) {
            const score = entries[0].score;
            const y = 44 - Math.max(0, Math.min(40, score / 2.5));
            svg.innerHTML = `<line x1="16" y1="${y}" x2="164" y2="${y}" class="trend-line trend-line-single"></line><circle cx="90" cy="${y}" r="5" class="trend-dot"></circle>`;
            return svg;
        }
        const scores = entries.map(item => item.score);
        const min = Math.min(...scores);
        const max = Math.max(...scores);
        const span = Math.max(1, max - min);
        const points = entries.map((item, index) => {
            const x = 16 + (148 * index / (entries.length - 1));
            const y = 44 - ((item.score - min) / span) * 32;
            return { x, y, score: item.score };
        });
        svg.innerHTML = `<polyline points="${points.map(point => `${point.x},${point.y}`).join(' ')}" class="trend-line"></polyline>${points.map(point => `<circle cx="${point.x}" cy="${point.y}" r="4" class="trend-dot"><title>${point.score}</title></circle>`).join('')}`;
        return svg;
    },

    createStudentOverviewShell() {
        const { root, body } = this.createShell('学生名单与作业概览');
        body.style.padding = '16px';
        const shell = document.createElement('section');
        shell.className = 'overview-shell';
        const heroHost = document.createElement('div');
        heroHost.className = 'modal-stage-host';
        heroHost.appendChild(this.createSkeletonCard(['38%', '72%', '42%'], 'modal-skeleton-card-lg'));
        const toolbarHost = document.createElement('div');
        toolbarHost.className = 'modal-stage-host';
        toolbarHost.appendChild(this.createSkeletonCard(['22%', '22%', '22%'], 'modal-skeleton-card-lg'));
        const editToolbarHost = document.createElement('div');
        editToolbarHost.className = 'modal-stage-host';
        editToolbarHost.appendChild(this.createSkeletonCard(['30%', '20%', '20%', '18%'], 'modal-skeleton-card-lg'));
        const boardEl = document.createElement('div');
        boardEl.className = 'overview-board';
        const listEl = document.createElement('div');
        listEl.className = 'overview-list';
        Array.from({ length: 6 }, () => this.createSkeletonCard(['28%', '52%', '68%', '48%'], 'modal-skeleton-card-lg')).forEach(card => listEl.appendChild(card));
        boardEl.appendChild(listEl);
        shell.append(heroHost, toolbarHost, editToolbarHost, boardEl);
        body.appendChild(shell);
        return {
            root,
            heroHost,
            toolbarHost,
            editToolbarHost,
            boardEl,
            listEl
        };
    },

    createStudentOverviewChrome() {
        const hero = document.createElement('div');
        hero.className = 'overview-hero overview-hero-summary modal-stage-ready';
        hero.dataset.role = 'summary';
        const toolbar = document.createElement('div');
        toolbar.className = 'overview-toolbar modal-stage-ready';
        toolbar.innerHTML = `<label class="overview-field">
                <span>科目筛选</span>
                <select class="input-ui" data-role="subject">
                    <option value="all">全部科目</option>
                    <option value="英语">英语</option>
                    <option value="数学">数学</option>
                    <option value="语文">语文</option>
                    <option value="其他">其他</option>
                </select>
            </label>
            <label class="overview-field overview-search">
                <span>搜索学生</span>
                <input class="input-ui" data-role="search" placeholder="输入学号或姓名">
            </label>
            <div class="overview-quick" data-role="quick">
                <button class="btn btn-c" type="button" data-sort="completion">按完成率</button>
                <button class="btn btn-c" type="button" data-sort="score">按平均分</button>
            </div>`;
        const editToolbar = document.createElement('div');
        editToolbar.className = 'overview-edit-toolbar modal-stage-ready';
        editToolbar.innerHTML = `<div class="overview-edit-actions">
                <button class="btn btn-p" type="button" data-act="add">新增学生</button>
                <button class="btn btn-c" type="button" data-act="autonum">编座号</button>
                <button class="btn btn-c" type="button" data-act="sort-seat">按座号排序</button>
                <button class="btn btn-c" type="button" data-act="clean">清空空行</button>
            </div>
            <div class="overview-edit-actions">
                <button class="btn btn-c" type="button" data-act="cancel">取消</button>
                <button class="btn btn-p" type="button" data-act="save">保存</button>
            </div>`;
        return {
            hero,
            toolbar,
            editToolbar,
            summaryEl: hero,
            subjectEl: toolbar.querySelector('[data-role="subject"]'),
            searchEl: toolbar.querySelector('[data-role="search"]'),
            quickEl: toolbar.querySelector('[data-role="quick"]')
        };
    }
};

globalThis.ActionViews = ActionViews;
