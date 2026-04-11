import { readFileSync } from 'fs';
import { join } from 'path';
import { vi } from 'vitest';

const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
document.documentElement.innerHTML = html;

// Mocks
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

global.alert = vi.fn();
global.confirm = vi.fn(() => true);
global.prompt = vi.fn();

// 首先加载 core.js 以定义全局常量
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
        // console.error(`Error loading ${file}:`, e);
    }
});
