/**
 * 模块化测试环境设置
 * 
 * 使用 ModuleLoader 解决测试中的脚本顺序依赖问题
 */

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

/**
 * 加载脚本并执行
 * @param {string} filePath - 脚本路径
 * @param {Object} context - 执行上下文
 */
function loadScript(filePath, context = {}) {
    const content = readFileSync(join(process.cwd(), filePath), 'utf8');
    const fn = new Function('context', `
        const globalThis = context.globalThis;
        const window = context.window;
        const document = context.document;
        const console = context.console;
        const localStorage = context.localStorage;
        ${Object.keys(context.exports || {}).map(k => `const ${k} = context.exports.${k};`).join('\n')}
        ${content}
        return typeof exports !== 'undefined' ? exports : {};
    `);
    return fn(context);
}

/**
 * 使用 ModuleLoader 方式加载模块
 */
async function setupModular() {
    // 1. 加载模块加载器
    const loaderContent = readFileSync(join(process.cwd(), 'module-loader.js'), 'utf8');
    new Function(loaderContent)();

    // 2. 定义测试用的 utils 模块
    globalThis.ModuleLoader.define('test-utils', [], () => {
        // 加载 utils.js 内容
        const utilsContent = readFileSync(join(process.cwd(), 'utils.js'), 'utf8');
        new Function(utilsContent)();
        
        // 返回全局对象
        return {
            $: globalThis.$,
            qs: globalThis.qs,
            qsa: globalThis.qsa,
            createEl: globalThis.createEl,
            LS: globalThis.LS,
            KEYS: globalThis.KEYS,
            ColorUtil: globalThis.ColorUtil,
            IdGenerator: globalThis.IdGenerator,
            Validator: globalThis.Validator,
            Toast: globalThis.Toast,
            ANIMATION_DURATION: globalThis.ANIMATION_DURATION,
            TIMER_DELAY: globalThis.TIMER_DELAY,
            INTERACTION_THRESHOLD: globalThis.INTERACTION_THRESHOLD,
            Device: globalThis.Device,
            DEFAULT_ROSTER: globalThis.DEFAULT_ROSTER
        };
    });

    // 3. 定义其他模块，按依赖顺序
    const moduleFiles = [
        { name: 'test-core', file: 'core.js', deps: ['test-utils'] },
        { name: 'test-back-handler', file: 'back-handler.js', deps: ['test-utils'] },
        { name: 'test-modal', file: 'modal.js', deps: ['test-utils', 'test-back-handler'] },
        { name: 'test-bottom-sheet', file: 'bottom-sheet.js', deps: ['test-utils'] },
        { name: 'test-scorepad', file: 'scorepad.js', deps: ['test-utils'] },
        { name: 'test-app', file: 'app.js', deps: ['test-utils'] },
        { name: 'test-action-views', file: 'action-views.js', deps: ['test-utils'] },
        { name: 'test-actions', file: 'actions.js', deps: ['test-utils', 'test-app', 'test-modal', 'test-bottom-sheet', 'test-scorepad', 'test-action-views'] },
    ];

    // 4. 注册所有模块
    for (const mod of moduleFiles) {
        globalThis.ModuleLoader.define(mod.name, mod.deps, (...deps) => {
            // 加载脚本内容
            const content = readFileSync(join(process.cwd(), mod.file), 'utf8');
            
            try {
                new Function(content)();
            } catch (e) {
                console.error(`Error loading ${mod.file}:`, e);
                throw e;
            }

            // 根据文件名返回对应的全局对象
            switch (mod.name) {
                case 'test-back-handler':
                    return globalThis.BackHandler;
                case 'test-modal':
                    return globalThis.Modal;
                case 'test-bottom-sheet':
                    return globalThis.BottomSheet;
                case 'test-scorepad':
                    return globalThis.ScorePad;
                case 'test-app':
                    return { State: globalThis.State, UI: globalThis.UI };
                case 'test-action-views':
                    return globalThis.ActionViews;
                case 'test-actions':
                    return globalThis.Actions;
                default:
                    return {};
            }
        });
    }

    // 5. 按顺序加载所有模块
    try {
        await globalThis.ModuleLoader.load('test-utils');
        console.log('[Test Setup] Utils loaded');

        for (const mod of moduleFiles) {
            await globalThis.ModuleLoader.load(mod.name);
            console.log(`[Test Setup] ${mod.name} loaded`);
        }

        console.log('[Test Setup] All modules loaded successfully');
    } catch (err) {
        console.error('[Test Setup] Failed to load modules:', err);
        throw err;
    }

    // 6. 为 Modal 添加测试所需的别名属性
    if (typeof Modal !== 'undefined' && typeof ANIMATION_DURATION !== 'undefined') {
        Modal.FULL_ENTER_MS = ANIMATION_DURATION.FULL_ENTER;
        Modal.FULL_EXIT_MS = ANIMATION_DURATION.FULL_EXIT;
    }
}

// 执行设置
await setupModular();
