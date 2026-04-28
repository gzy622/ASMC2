import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Utils (工具函数)', () => {
    describe('DOM 操作工具', () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div id="test-container">
                    <div class="item" data-id="1">Item 1</div>
                    <div class="item" data-id="2">Item 2</div>
                    <div class="item" data-id="3">Item 3</div>
                </div>
            `;
        });

        describe('$ (getElementById)', () => {
            it('应该通过 ID 获取元素', () => {
                const el = $('test-container');
                expect(el).not.toBeNull();
                expect(el.id).toBe('test-container');
            });

            it('不存在的 ID 应该返回 null', () => {
                const el = $('non-existent');
                expect(el).toBeNull();
            });
        });

        describe('qs (querySelector)', () => {
            it('应该获取第一个匹配的元素', () => {
                const el = qs('.item');
                expect(el).not.toBeNull();
                expect(el.dataset.id).toBe('1');
            });

            it('应该在指定父元素内查找', () => {
                const container = $('test-container');
                const el = qs('.item', container);
                expect(el).not.toBeNull();
                expect(el.dataset.id).toBe('1');
            });
        });

        describe('qsa (querySelectorAll)', () => {
            it('应该获取所有匹配的元素', () => {
                const els = qsa('.item');
                expect(els.length).toBe(3);
            });

            it('应该在指定父元素内查找', () => {
                const container = $('test-container');
                const els = qsa('.item', container);
                expect(els.length).toBe(3);
            });
        });

        describe('createEl', () => {
            it('应该创建元素', () => {
                const el = createEl('div');
                expect(el.tagName).toBe('DIV');
            });

            it('应该设置属性', () => {
                const el = createEl('div', { id: 'test', className: 'test-class' });
                expect(el.id).toBe('test');
                expect(el.className).toBe('test-class');
            });

            it('应该设置文本内容', () => {
                const el = createEl('div', {}, 'Hello World');
                expect(el.textContent).toBe('Hello World');
            });

            it('应该设置 dataset', () => {
                const el = createEl('div', { dataset: { id: '123', name: 'test' } });
                expect(el.dataset.id).toBe('123');
                expect(el.dataset.name).toBe('test');
            });
        });
    });

    describe('格式化工具', () => {
        describe('clamp', () => {
            it('应该在范围内返回原值', () => {
                expect(clamp(50, 0, 100)).toBe(50);
            });

            it('应该限制最小值', () => {
                expect(clamp(-10, 0, 100)).toBe(0);
            });

            it('应该限制最大值', () => {
                expect(clamp(150, 0, 100)).toBe(100);
            });

            it('应该四舍五入', () => {
                expect(clamp(50.6)).toBe(51);
            });
        });

        describe('formatBackupFileName', () => {
            it('应该生成正确的文件名格式', () => {
                const date = new Date('2024-01-15T10:30:45');
                const filename = formatBackupFileName(date);
                expect(filename).toMatch(/^assignmentcheck2_backup_20240115_103045\.json$/);
            });
        });

        describe('ColorUtil', () => {
            describe('hexToRgb', () => {
                it('应该正确解析6位十六进制', () => {
                    const rgb = ColorUtil.hexToRgb('#FF5733');
                    expect(rgb).toEqual({ r: 255, g: 87, b: 51 });
                });

                it('应该正确解析3位十六进制', () => {
                    const rgb = ColorUtil.hexToRgb('#F53');
                    expect(rgb).toEqual({ r: 255, g: 85, b: 51 });
                });

                it('无效值应该返回回退颜色', () => {
                    const rgb = ColorUtil.hexToRgb('invalid', '#FFFFFF');
                    expect(rgb).toEqual({ r: 255, g: 255, b: 255 });
                });
            });

            describe('rgbToHex', () => {
                it('应该正确转换为十六进制', () => {
                    const hex = ColorUtil.rgbToHex({ r: 255, g: 87, b: 51 });
                    expect(hex).toBe('#ff5733');
                });
            });

            describe('normalizeHex', () => {
                it('应该规范化颜色值', () => {
                    const hex = ColorUtil.normalizeHex('#FF5733');
                    expect(hex).toBe('#ff5733');
                });
            });

            describe('mix', () => {
                it('应该正确混合两种颜色', () => {
                    const mixed = ColorUtil.mix('#FF0000', '#0000FF', 0.5);
                    expect(mixed).toBe('#800080');
                });
            });

            describe('withAlpha', () => {
                it('应该正确应用透明度', () => {
                    const rgba = ColorUtil.withAlpha('#FF5733', 0.5);
                    expect(rgba).toBe('rgba(255, 87, 51, 0.5)');
                });
            });

            describe('luminance', () => {
                it('应该计算正确的亮度值', () => {
                    const lum = ColorUtil.luminance('#FFFFFF');
                    expect(lum).toBeGreaterThan(0.9);
                });

                it('黑色亮度应该接近0', () => {
                    const lum = ColorUtil.luminance('#000000');
                    expect(lum).toBeLessThan(0.1);
                });
            });
        });

        describe('IdGenerator', () => {
            beforeEach(() => {
                IdGenerator.reset();
            });

            it('应该生成唯一 ID', () => {
                const id1 = IdGenerator.generate();
                const id2 = IdGenerator.generate();
                expect(id1).not.toBe(id2);
            });

            it('应该基于时间戳生成', () => {
                const before = Date.now();
                const id = IdGenerator.generate();
                const after = Date.now();
                expect(id).toBeGreaterThanOrEqual(before);
                expect(id).toBeLessThanOrEqual(after + 1);
            });

            it('generateUnique 应该避开已存在的 ID', () => {
                const existingIds = new Set([1, 2, 3]);
                const id = IdGenerator.generateUnique(id => existingIds.has(id));
                expect(existingIds.has(id)).toBe(false);
            });

            it('peek 应该返回下一个可能的 ID', () => {
                const peeked = IdGenerator.peek();
                const generated = IdGenerator.generate();
                expect(peeked).toBeLessThanOrEqual(generated);
            });
        });
    });

    describe('验证工具', () => {
        describe('isValidObject', () => {
            it('应该正确识别对象', () => {
                expect(isValidObject({})).toBe(true);
                expect(isValidObject({ a: 1 })).toBe(true);
            });

            it('应该拒绝 null', () => {
                expect(isValidObject(null)).toBe(false);
            });

            it('应该拒绝非对象类型', () => {
                expect(isValidObject('string')).toBe(false);
                expect(isValidObject(123)).toBe(false);
                expect(isValidObject([])).toBe(true); // 数组也是对象
            });
        });

        describe('isValidArray', () => {
            it('应该正确识别数组', () => {
                expect(isValidArray([])).toBe(true);
                expect(isValidArray([1, 2, 3])).toBe(true);
            });

            it('应该拒绝非数组', () => {
                expect(isValidArray({})).toBe(false);
                expect(isValidArray('string')).toBe(false);
            });
        });

        describe('isNonEmptyString', () => {
            it('应该正确识别非空字符串', () => {
                expect(isNonEmptyString('hello')).toBe(true);
                expect(isNonEmptyString('  hello  ')).toBe(true);
            });

            it('应该拒绝空字符串', () => {
                expect(isNonEmptyString('')).toBe(false);
                expect(isNonEmptyString('   ')).toBe(false);
            });

            it('应该拒绝非字符串', () => {
                expect(isNonEmptyString(123)).toBe(false);
                expect(isNonEmptyString(null)).toBe(false);
            });
        });

        describe('isValidNumber', () => {
            it('应该正确识别有效数字', () => {
                expect(isValidNumber(0)).toBe(true);
                expect(isValidNumber(123)).toBe(true);
                expect(isValidNumber(-45.6)).toBe(true);
            });

            it('应该拒绝 NaN', () => {
                expect(isValidNumber(NaN)).toBe(false);
            });

            it('应该拒绝 Infinity', () => {
                expect(isValidNumber(Infinity)).toBe(false);
                expect(isValidNumber(-Infinity)).toBe(false);
            });

            it('应该拒绝非数字', () => {
                expect(isValidNumber('123')).toBe(false);
                expect(isValidNumber(null)).toBe(false);
            });
        });

        describe('isValidImportData', () => {
            it('应该接受有效的导入数据', () => {
                const data = { list: [], data: [] };
                expect(isValidImportData(data)).toBe(true);
            });

            it('应该拒绝缺少必需字段的数据', () => {
                expect(isValidImportData({ list: [] })).toBe(false);
                expect(isValidImportData({ data: [] })).toBe(false);
            });

            it('应该拒绝非对象数据', () => {
                expect(isValidImportData(null)).toBe(false);
                expect(isValidImportData('string')).toBe(false);
            });
        });

        describe('isValidStudentId', () => {
            it('应该接受有效的学生ID', () => {
                expect(isValidStudentId('01')).toBe(true);
                expect(isValidStudentId('99')).toBe(true);
            });

            it('应该拒绝无效格式', () => {
                expect(isValidStudentId('1')).toBe(false);
                expect(isValidStudentId('123')).toBe(false);
                expect(isValidStudentId('ab')).toBe(false);
            });
        });

        describe('isValidAssignment', () => {
            it('应该接受有效的任务对象', () => {
                const asg = { id: 1, name: '测试任务' };
                expect(isValidAssignment(asg)).toBe(true);
            });

            it('应该拒绝缺少 id 的任务', () => {
                const asg = { name: '测试任务' };
                expect(isValidAssignment(asg)).toBe(false);
            });

            it('应该拒绝缺少 name 的任务', () => {
                const asg = { id: 1 };
                expect(isValidAssignment(asg)).toBe(false);
            });
        });
    });

    describe('存储工具', () => {
        describe('LS (localStorage 封装)', () => {
            beforeEach(() => {
                localStorage.clear();
            });

            it('应该能够存储和读取数据', () => {
                LS.set('test-key', { foo: 'bar' });
                const result = LS.get('test-key');
                expect(result).toEqual({ foo: 'bar' });
            });

            it('不存在的键应该返回默认值', () => {
                const result = LS.get('non-existent', 'default');
                expect(result).toBe('default');
            });

            it('应该能够删除数据', () => {
                LS.set('test-key', 'value');
                LS.remove('test-key');
                const result = LS.get('test-key', null);
                expect(result).toBeNull();
            });

            it('相同的值不应该重复写入', () => {
                const setSpy = vi.spyOn(Storage.prototype, 'setItem');
                LS.set('test-key', 'value');
                LS.set('test-key', 'value');
                expect(setSpy).toHaveBeenCalledTimes(1);
            });
        });

        describe('KEYS 常量', () => {
            it('应该定义所有必需的键', () => {
                expect(KEYS.DATA).toBeDefined();
                expect(KEYS.LIST).toBeDefined();
                expect(KEYS.ANIM).toBeDefined();
                expect(KEYS.PREFS).toBeDefined();
                expect(KEYS.DRAFT).toBeDefined();
                expect(KEYS.SCOREPAD_FAST_TEN).toBeDefined();
            });
        });
    });

    describe('动画工具', () => {
        describe('ANIMATION_DURATION 常量', () => {
            it('应该定义所有动画时长', () => {
                expect(ANIMATION_DURATION.FULL_ENTER).toBe(220);
                expect(ANIMATION_DURATION.FULL_EXIT).toBe(160);
                expect(ANIMATION_DURATION.BOTTOM_SHEET_CLOSE).toBe(260);
                expect(ANIMATION_DURATION.LOADING_MASK_FADE).toBe(90);
            });
        });

        describe('TIMER_DELAY 常量', () => {
            it('应该定义所有定时器延迟', () => {
                expect(TIMER_DELAY.DRAFT_PERSIST).toBe(1200);
                expect(TIMER_DELAY.CARD_META_SAVE).toBe(250);
                expect(TIMER_DELAY.BACK_SIGNAL_DEBOUNCE).toBe(80);
                expect(TIMER_DELAY.EXIT_WINDOW).toBe(1500);
            });
        });

        describe('INTERACTION_THRESHOLD 常量', () => {
            it('应该定义所有交互阈值', () => {
                expect(INTERACTION_THRESHOLD.DRAG_CLOSE).toBe(80);
                expect(INTERACTION_THRESHOLD.DRAG_MAX_OFFSET).toBe(200);
            });
        });

        describe('Device 检测', () => {
            it('isAndroid 应该正确检测', () => {
                // 由于无法修改 navigator，只能测试返回值类型
                expect(typeof Device.isAndroid()).toBe('boolean');
            });

            it('isFirefox 应该正确检测', () => {
                expect(typeof Device.isFirefox()).toBe('boolean');
            });

            it('isCoarsePointer 应该正确检测', () => {
                expect(typeof Device.isCoarsePointer()).toBe('boolean');
            });
        });

        describe('nextFrame / cancelFrame', () => {
            it('nextFrame 应该返回数字 ID', () => {
                const id = nextFrame(() => {});
                expect(typeof id).toBe('number');
                cancelFrame(id);
            });
        });
    });

    describe('Toast 通知', () => {
        beforeEach(() => {
            document.body.innerHTML = '<div id="toast"></div>';
            Toast.init();
        });

        it('应该显示消息', () => {
            Toast.show('测试消息');
            expect(Toast.el.textContent).toBe('测试消息');
            expect(Toast.el.classList.contains('show')).toBe(true);
        });

        it('应该使用默认显示时间', () => {
            vi.useFakeTimers();
            Toast.show('测试消息');
            expect(Toast.el.classList.contains('show')).toBe(true);

            vi.advanceTimersByTime(1500);
            expect(Toast.el.classList.contains('show')).toBe(false);
            vi.useRealTimers();
        });
    });

    describe('默认数据', () => {
        it('DEFAULT_ROSTER 应该包含学生名单', () => {
            expect(DEFAULT_ROSTER.length).toBeGreaterThan(0);
            expect(DEFAULT_ROSTER[0]).toMatch(/^\d{2}\s[\u4e00-\u9fff]{2,3}$/);
            expect(DEFAULT_ROSTER.every(line => /^\d{2}\s[\u4e00-\u9fff]{2,3}$/.test(line))).toBe(true);
        });

        it('SUBJECT_PRESETS 应该包含科目预设', () => {
            expect(SUBJECT_PRESETS).toContain('英语');
            expect(SUBJECT_PRESETS).toContain('语文');
            expect(SUBJECT_PRESETS).toContain('数学');
        });

        it('CARD_COLOR_PRESETS 应该包含颜色预设', () => {
            expect(CARD_COLOR_PRESETS.length).toBeGreaterThan(0);
            expect(CARD_COLOR_PRESETS[0]).toMatch(/^#[0-9A-Fa-f]{6}$/);
        });
    });
});
