import { readFileSync } from 'fs';
import { join } from 'path';
import { vi } from 'vitest';

const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
document.documentElement.innerHTML = html;

// Mocks
global.ResizeObserver = class ResizeObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
};

global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
};

global.alert = vi.fn();
global.confirm = vi.fn(() => true);
global.prompt = vi.fn();

// 首先加载 constants.js 以定义全局常量
const constantsContent = readFileSync(join(process.cwd(), 'constants.js'), 'utf8');
(new Function(constantsContent))();

// 然后加载 utils.js 以定义全局常量和工具函数
const utilsContent = readFileSync(join(process.cwd(), 'utils.js'), 'utf8');
(new Function(utilsContent))();

// 然后加载 core.js（保留向后兼容）
const coreContent = readFileSync(join(process.cwd(), 'core.js'), 'utf8');
(new Function(coreContent))();

// 然后加载其他模块
const files = [
    'back-handler.js',
    'modal.js',
    'bottom-sheet.js',
    'scorepad.js',
    'app.js',
    'action-views.js',
    'actions.js',
    'boot.js'
];

files.forEach(file => {
    const content = readFileSync(join(process.cwd(), file), 'utf8');
    try {
        (new Function(content))();
    } catch (e) {
        console.error(`Error loading ${file}:`, e);
        throw e;
    }
});

// 为 Modal 对象添加测试所需的别名属性
if (typeof Modal !== 'undefined' && typeof ANIMATION_DURATION !== 'undefined') {
    Modal.FULL_ENTER_MS = ANIMATION_DURATION.FULL_ENTER;
    Modal.FULL_EXIT_MS = ANIMATION_DURATION.FULL_EXIT;
}
