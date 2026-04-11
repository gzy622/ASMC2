import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ScorePad', () => {
    beforeEach(() => {
        // 初始化 ScorePad
        if (!ScorePad.el) {
            ScorePad.init();
        }
        // 重置状态
        ScorePad.isOpen = false;
        ScorePad.currentId = null;
        ScorePad.currentName = null;
        ScorePad.value = '';
        ScorePad.submitAction = 'confirm';
        ScorePad.fastTenMode = false;
        ScorePad._keypadMode = '';
        ScorePad._savedCardTimers.clear();

        // 清理 DOM
        document.querySelectorAll('.scorepad, .scorepad-backdrop').forEach(el => el.remove());

        // 重新初始化
        ScorePad.init();

        // Mock State.cur
        vi.spyOn(State, 'cur', 'get').mockReturnValue({
            id: 1,
            name: '测试任务',
            subject: '英语',
            records: {}
        });
    });

    afterEach(() => {
        ScorePad.hide();
        vi.restoreAllMocks();
        document.querySelectorAll('.scorepad, .scorepad-backdrop').forEach(el => el.remove());
    });

    describe('初始化', () => {
        it('应该正确初始化 ScorePad', () => {
            expect(ScorePad.el).toBeDefined();
            expect(ScorePad.backdrop).toBeDefined();
            expect(ScorePad.keypadEl).toBeDefined();
            expect(ScorePad.displayEl).toBeDefined();
            expect(ScorePad.modeToggleEl).toBeDefined();
        });

        it('应该从本地存储加载快速十分模式设置', () => {
            LS.set(KEYS.SCOREPAD_FAST_TEN, true);
            const newScorePad = Object.create(ScorePad);
            Object.assign(newScorePad, ScorePad);
            newScorePad.fastTenMode = !!LS.get(KEYS.SCOREPAD_FAST_TEN, false);
            expect(newScorePad.fastTenMode).toBe(true);
        });
    });

    describe('显示/隐藏', () => {
        it('应该能够显示记分板', () => {
            const mockRect = { top: 100, height: 60 };
            ScorePad.show('01', '张三', mockRect);

            expect(ScorePad.isOpen).toBe(true);
            expect(ScorePad.currentId).toBe('01');
            expect(ScorePad.currentName).toBe('张三');
            expect(ScorePad.el.classList.contains('is-open')).toBe(true);
            expect(ScorePad.backdrop.classList.contains('is-open')).toBe(true);
        });

        it('显示时应该加载已有分数', () => {
            const mockRecords = { '01': { score: '85', done: true } };
            vi.spyOn(State, 'cur', 'get').mockReturnValue({
                id: 1,
                name: '测试任务',
                subject: '英语',
                records: mockRecords
            });

            ScorePad.show('01', '张三', { top: 100, height: 60 });
            expect(ScorePad.value).toBe('85');
        });

        it('重复显示应该被忽略', () => {
            ScorePad.show('01', '张三', { top: 100, height: 60 });
            const firstCall = ScorePad.currentId;

            ScorePad.show('02', '李四', { top: 100, height: 60 });
            expect(ScorePad.currentId).toBe(firstCall);
        });

        it('应该能够隐藏记分板', () => {
            ScorePad.show('01', '张三', { top: 100, height: 60 });
            ScorePad.hide();

            expect(ScorePad.isOpen).toBe(false);
            expect(ScorePad.el.classList.contains('is-open')).toBe(false);
            expect(ScorePad.backdrop.classList.contains('is-open')).toBe(false);
        });

        it('隐藏时应该重置状态', () => {
            ScorePad.show('01', '张三', { top: 100, height: 60 });
            ScorePad.value = '100';
            ScorePad.hide();

            expect(ScorePad.currentId).toBeNull();
            expect(ScorePad.currentName).toBeNull();
            expect(ScorePad.value).toBe('');
            expect(ScorePad.submitAction).toBe('confirm');
        });
    });

    describe('快速十分模式', () => {
        it('应该能够切换快速十分模式', () => {
            const initialMode = ScorePad.fastTenMode;
            ScorePad._setFastTenMode(!initialMode, { persist: false });

            expect(ScorePad.fastTenMode).toBe(!initialMode);
            expect(ScorePad.el.classList.contains('fast-ten-mode')).toBe(!initialMode);
        });

        it('快速十分模式应该渲染不同的键盘布局', () => {
            ScorePad._setFastTenMode(true, { persist: false });
            ScorePad._renderKeypad();

            const fastKeys = ScorePad.keypadEl.querySelectorAll('.scorepad-key-fast');
            expect(fastKeys.length).toBe(10); // 10, 20, 30, ..., 100
        });

        it('普通模式应该渲染标准数字键盘', () => {
            ScorePad._setFastTenMode(false, { persist: false });
            ScorePad._renderKeypad();

            const keys = ScorePad.keypadEl.querySelectorAll('.scorepad-key');
            const hasNumbers = Array.from(keys).some(k => k.dataset.val === '1');
            expect(hasNumbers).toBe(true);
        });

        it('切换模式应该持久化到本地存储', () => {
            ScorePad._setFastTenMode(true, { persist: true });
            expect(LS.get(KEYS.SCOREPAD_FAST_TEN)).toBe(true);

            ScorePad._setFastTenMode(false, { persist: true });
            expect(LS.get(KEYS.SCOREPAD_FAST_TEN)).toBe(false);
        });
    });

    describe('键盘输入', () => {
        beforeEach(() => {
            ScorePad.show('01', '张三', { top: 100, height: 60 });
        });

        it('应该能够输入数字', () => {
            ScorePad.value = '8';
            ScorePad._updateDisplay();

            expect(ScorePad.displayEl.value).toBe('8');
        });

        it('应该能够追加数字', () => {
            ScorePad.value = '8';
            ScorePad.value += '5';
            ScorePad._updateDisplay();

            expect(ScorePad.displayEl.value).toBe('85');
        });

        it('应该能够清除输入', () => {
            ScorePad.value = '85';
            ScorePad.value = '';
            ScorePad._updateDisplay();

            expect(ScorePad.displayEl.value).toBe('');
        });

        it('应该能够退格删除', () => {
            ScorePad.value = '85';
            ScorePad.value = ScorePad.value.slice(0, -1);
            ScorePad._updateDisplay();

            expect(ScorePad.displayEl.value).toBe('8');
        });
    });

    describe('格式化功能', () => {
        it('应该正确格式化学生标签', () => {
            const label1 = ScorePad._formatStudentLabel('01', '张三');
            expect(label1).toBe('01 张三');

            const label2 = ScorePad._formatStudentLabel('', '张三');
            expect(label2).toBe('张三');

            const label3 = ScorePad._formatStudentLabel('01', '');
            expect(label3).toBe('01');

            const label4 = ScorePad._formatStudentLabel('', '');
            expect(label4).toBe('');
        });

        it('应该正确格式化提交提示', () => {
            const hint1 = ScorePad._formatSubmitHint('85', '01', '张三');
            expect(hint1).toBe('01 张三 已记分 85');

            const hint2 = ScorePad._formatSubmitHint('', '01', '张三');
            expect(hint2).toBe('01 张三 已清除分数');

            const hint3 = ScorePad._formatSubmitHint('90', '', '');
            expect(hint3).toBe('已记分 90');
        });
    });

    describe('面板高度计算', () => {
        it('应该计算合理的面板高度', () => {
            const height = ScorePad._estimatePanelHeight();
            expect(typeof height).toBe('number');
            expect(height).toBeGreaterThan(300);
            expect(height).toBeLessThan(500);
        });
    });

    describe('指针事件处理', () => {
        it('应该正确处理指针按下事件', () => {
            const mockEvent = {
                isPrimary: true,
                pointerId: 1,
                clientY: 100
            };

            ScorePad._onPointerDown(mockEvent);

            expect(ScorePad._activePointerId).toBe(1);
            expect(ScorePad._pointerStartY).toBe(100);
            expect(ScorePad._isPointerPrimed).toBe(true);
        });

        it('非主指针应该被忽略', () => {
            // 先重置状态
            ScorePad._activePointerId = null;

            const mockEvent = {
                isPrimary: false,
                pointerId: 1,
                clientY: 100
            };

            ScorePad._onPointerDown(mockEvent);

            expect(ScorePad._activePointerId).toBeNull();
        });

        it('应该正确处理指针移动', () => {
            ScorePad._activePointerId = 1;
            ScorePad._isPointerPrimed = true;
            ScorePad._pointerStartY = 100;

            const mockEvent = {
                pointerId: 1,
                clientY: 150,
                preventDefault: vi.fn()
            };

            ScorePad._onPointerMove(mockEvent);

            expect(ScorePad._pointerCurrentY).toBe(150);
        });
    });

    describe('保存和关闭', () => {
        beforeEach(() => {
            ScorePad.show('01', '张三', { top: 100, height: 60 });
            vi.spyOn(State, 'updRec').mockImplementation(() => {});
            vi.spyOn(ScorePad, '_showSubmitHint').mockImplementation(() => {});
            vi.spyOn(ScorePad, '_flashSavedCard').mockImplementation(() => {});
        });

        it('保存时应该更新记录', () => {
            ScorePad.value = '85';
            ScorePad._saveAndClose();

            expect(State.updRec).toHaveBeenCalledWith('01', {
                score: '85',
                done: true
            }, expect.any(Object));
        });

        it('保存空值时应该清除分数', () => {
            ScorePad.value = '';
            ScorePad._saveAndClose();

            expect(State.updRec).toHaveBeenCalledWith('01', {
                score: null,
                done: false
            }, expect.any(Object));
        });

        it('保存后应该隐藏面板', () => {
            vi.spyOn(ScorePad, 'hide').mockImplementation(() => {});
            ScorePad.value = '85';
            ScorePad._saveAndClose();

            expect(ScorePad.hide).toHaveBeenCalled();
        });
    });

    describe('草稿保存延迟常量', () => {
        it('应该使用正确的草稿保存延迟', () => {
            expect(TIMER_DELAY.DRAFT_PERSIST).toBe(1200);
        });

        it('应该使用正确的卡片元数据保存延迟', () => {
            expect(TIMER_DELAY.CARD_META_SAVE).toBe(250);
        });
    });
});
