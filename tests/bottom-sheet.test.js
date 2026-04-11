import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('BottomSheet', () => {
    beforeEach(() => {
        // 清理 DOM
        document.querySelectorAll('.bottom-sheet, .bottom-sheet-backdrop').forEach(el => el.remove());
        BottomSheet.activeSheet = null;
        // 禁用动画以加速测试
        State.animations = false;
    });

    afterEach(() => {
        // 清理
        document.querySelectorAll('.bottom-sheet, .bottom-sheet-backdrop').forEach(el => el.remove());
        BottomSheet.activeSheet = null;
        vi.restoreAllMocks();
        State.animations = true;
    });

    describe('创建面板', () => {
        it('应该能够创建底部面板', () => {
            const sheet = BottomSheet.create({
                title: '测试标题',
                content: document.createElement('div')
            });

            expect(sheet).toBeDefined();
            expect(sheet.panel).toBeDefined();
            expect(sheet.backdrop).toBeDefined();
        });

        it('应该正确设置面板标题', () => {
            const sheet = BottomSheet.create({
                title: '测试标题',
                content: document.createElement('div')
            });

            const titleEl = sheet.panel.querySelector('.bottom-sheet-title');
            expect(titleEl).not.toBeNull();
            expect(titleEl.textContent).toBe('测试标题');
        });

        it('应该正确插入内容元素', () => {
            const content = document.createElement('div');
            content.className = 'test-content';
            content.textContent = '测试内容';

            const sheet = BottomSheet.create({
                content: content
            });

            const bodyEl = sheet.panel.querySelector('.bottom-sheet-body');
            expect(bodyEl.contains(content)).toBe(true);
        });

        it('应该创建按钮', () => {
            const sheet = BottomSheet.create({
                content: document.createElement('div'),
                buttons: [
                    { text: '取消', type: 'btn btn-c' },
                    { text: '确定', type: 'btn btn-p', primary: true }
                ]
            });

            const buttons = sheet.panel.querySelectorAll('.bottom-sheet-footer button');
            expect(buttons.length).toBe(2);
        });
    });

    describe('显示/隐藏', () => {
        it('应该能够显示面板', () => {
            const sheet = BottomSheet.create({
                content: document.createElement('div')
            });

            sheet.show();
            expect(sheet.isOpen).toBe(true);
            expect(sheet.panel.classList.contains('is-open')).toBe(true);
            expect(sheet.backdrop.classList.contains('is-open')).toBe(true);

            sheet.hide();
        });

        it('显示时应该锁定 body 滚动', () => {
            const sheet = BottomSheet.create({
                content: document.createElement('div')
            });

            sheet.show();
            expect(document.body.style.overflow).toBe('hidden');

            sheet.hide();
        });

        it('隐藏时应该恢复 body 滚动', () => {
            const sheet = BottomSheet.create({
                content: document.createElement('div')
            });

            sheet.show();
            sheet.hide();

            expect(document.body.style.overflow).toBe('');
        });

        it('重复显示应该被忽略', () => {
            const sheet = BottomSheet.create({
                content: document.createElement('div')
            });

            sheet.show();
            const firstResolve = sheet._resolve;

            sheet.show(); // 重复显示
            expect(sheet._resolve).toBe(firstResolve);

            sheet.hide();
        });

        it('关闭时应该触发 onClose 回调', () => {
            const onClose = vi.fn();
            const sheet = BottomSheet.create({
                content: document.createElement('div'),
                onClose
            });

            sheet.show();
            sheet.hide('test-result');

            expect(onClose).toHaveBeenCalledWith('test-result');
        });
    });

    describe('活动面板管理', () => {
        it('显示新面板时应该关闭旧面板', () => {
            const sheet1 = BottomSheet.create({
                content: document.createElement('div')
            });
            const sheet2 = BottomSheet.create({
                content: document.createElement('div')
            });

            sheet1.show();
            expect(BottomSheet.activeSheet).toBe(sheet1);

            sheet2.show();
            expect(BottomSheet.activeSheet).toBe(sheet2);

            sheet2.hide();
        });

        it('关闭时应该清除活动面板引用', () => {
            const sheet = BottomSheet.create({
                content: document.createElement('div')
            });

            sheet.show();
            sheet.hide();

            expect(BottomSheet.activeSheet).toBeNull();
        });
    });

    describe('确认对话框', () => {
        it('confirm 应该返回 Promise', () => {
            const result = BottomSheet.confirm('确认消息');
            expect(result).toBeInstanceOf(Promise);
        });

        it('点击确定应该 resolve true', async () => {
            const confirmPromise = BottomSheet.confirm('确认消息');

            // 等待面板创建
            await new Promise(resolve => setTimeout(resolve, 0));

            const sheet = BottomSheet.activeSheet;
            expect(sheet).not.toBeNull();

            // 模拟点击确定按钮
            const confirmBtn = sheet.panel.querySelector('[data-btn-idx="1"]');
            confirmBtn.click();

            const result = await confirmPromise;
            expect(result).toBe(true);
        });

        it('点击取消应该 resolve false', async () => {
            const confirmPromise = BottomSheet.confirm('确认消息');

            await new Promise(resolve => setTimeout(resolve, 0));

            const sheet = BottomSheet.activeSheet;
            const cancelBtn = sheet.panel.querySelector('[data-btn-idx="0"]');
            cancelBtn.click();

            const result = await confirmPromise;
            expect(result).toBe(false);
        });
    });

    describe('提示对话框', () => {
        it('alert 应该返回 Promise', () => {
            const result = BottomSheet.alert('提示消息');
            expect(result).toBeInstanceOf(Promise);
        });

        it('alert 应该显示消息内容', async () => {
            BottomSheet.alert('测试提示消息');

            await new Promise(resolve => setTimeout(resolve, 0));

            const sheet = BottomSheet.activeSheet;
            const contentEl = sheet.panel.querySelector('.bottom-sheet-alert-text');
            expect(contentEl.textContent).toBe('测试提示消息');

            sheet.hide();
        });
    });

    describe('输入对话框', () => {
        it('prompt 应该返回 Promise', () => {
            const result = BottomSheet.prompt('输入标题');
            expect(result).toBeInstanceOf(Promise);
        });

        it('prompt 应该显示默认值', async () => {
            BottomSheet.prompt('输入标题', '默认值');

            await new Promise(resolve => setTimeout(resolve, 50));

            const sheet = BottomSheet.activeSheet;
            const input = sheet.panel.querySelector('.bottom-sheet-prompt-input');
            expect(input.value).toBe('默认值');

            sheet.hide();
        });

        it('点击确定应该返回输入值', async () => {
            const promptPromise = BottomSheet.prompt('输入标题', '默认值');

            await new Promise(resolve => setTimeout(resolve, 50));

            const sheet = BottomSheet.activeSheet;
            const input = sheet.panel.querySelector('.bottom-sheet-prompt-input');
            input.value = '新值';

            const confirmBtn = sheet.panel.querySelector('[data-btn-idx="1"]');
            confirmBtn.click();

            const result = await promptPromise;
            expect(result).toBe('新值');
        });

        it('点击取消应该返回 false', async () => {
            const promptPromise = BottomSheet.prompt('输入标题');

            await new Promise(resolve => setTimeout(resolve, 50));

            const sheet = BottomSheet.activeSheet;
            const cancelBtn = sheet.panel.querySelector('[data-btn-idx="0"]');
            cancelBtn.click();

            const result = await promptPromise;
            expect(result).toBe(false);
        });
    });

    describe('拖拽功能', () => {
        it('应该处理指针按下事件', () => {
            const sheet = BottomSheet.create({
                content: document.createElement('div'),
                enableDrag: true
            });

            const handle = sheet.panel.querySelector('.bottom-sheet-handle');
            expect(handle).not.toBeNull();
        });

        it('禁用拖拽时不应该显示手柄', () => {
            const sheet = BottomSheet.create({
                content: document.createElement('div'),
                enableDrag: false
            });

            const handle = sheet.panel.querySelector('.bottom-sheet-handle');
            expect(handle).toBeNull();
        });
    });

    describe('键盘事件', () => {
        it('应该响应 ESC 键关闭', () => {
            const sheet = BottomSheet.create({
                content: document.createElement('div')
            });

            sheet.show();

            // 模拟 ESC 键
            const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            document.dispatchEvent(escEvent);

            expect(sheet.isOpen).toBe(false);
        });
    });

    describe('动画设置', () => {
        it('animationsEnabled 应该返回正确值', () => {
            State.animations = true;
            expect(BottomSheet.animationsEnabled()).toBe(true);

            State.animations = false;
            expect(BottomSheet.animationsEnabled()).toBe(false);
        });
    });

    describe('清理功能', () => {
        it('隐藏后应该清理 DOM 元素', () => {
            const sheet = BottomSheet.create({
                content: document.createElement('div')
            });

            sheet.show();
            const backdrop = sheet.backdrop;
            const panel = sheet.panel;

            sheet.hide();

            // 禁用动画时立即清理
            expect(backdrop.parentNode).toBeNull();
            expect(panel.parentNode).toBeNull();
        });
    });
});
