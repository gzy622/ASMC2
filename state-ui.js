(() => {
    const root = globalThis.__AC2_INTERNALS__ || (globalThis.__AC2_INTERNALS__ = {});

    const applyAnim = ({ animations, documentRef, getById }) => {
        documentRef.body.classList.toggle('no-animations', !animations);
        const status = getById('statusAnim');
        if (status) status.textContent = animations ? '开' : '关';
    };

    const applyCardColor = ({ prefs, ColorUtil, documentRef }) => {
        const base = ColorUtil.normalizeHex(prefs?.cardDoneColor, '#68c490');
        const [start, end, border] = [0.08, 0.14, 0.2].map(r => ColorUtil.mix(base, r === 0.08 ? '#ffffff' : '#10261a', r));
        const lum = ColorUtil.luminance(base);
        const badgeBg = lum > 0.35 ? ColorUtil.mix('#111111', '#ffffff', 0.12) : ColorUtil.mix('#ffffff', '#111111', 0.08);
        const badgeText = lum > 0.35 ? 'rgba(255,255,255,0.95)' : 'rgba(17,17,17,0.92)';
        const style = documentRef.documentElement.style;
        style.setProperty('--done-card-start', start);
        style.setProperty('--done-card-end', end);
        style.setProperty('--done-card-border', border);
        style.setProperty('--done-card-shadow', ColorUtil.withAlpha(base, 0.22));
        style.setProperty('--done-card-press-shadow', ColorUtil.withAlpha(base, 0.32));
        style.setProperty('--done-card-badge', badgeBg);
        style.setProperty('--done-card-badge-text', badgeText);
    };

    const applyScoring = ({ scoring, getById }) => {
        const status = getById('statusScore');
        if (status) status.textContent = scoring ? '开' : '关';
        const button = getById('btnScore');
        if (button) button.classList.toggle('active', !!scoring);
    };

    const applyViewMode = ({ mode, documentRef, getById }) => {
        const showNames = mode === 'name';
        documentRef.body.classList.toggle('mode-names', showNames);
        const status = getById('statusView');
        if (status) status.textContent = showNames ? '开' : '关';
        const button = getById('btnView');
        if (button) button.classList.toggle('active', showNames);
    };

    const toggleViewMode = (mode) => mode === 'id' ? 'name' : 'id';

    const createUiRuntime = ({
        documentRef,
        getById,
        ColorUtil,
        mode,
        setMode,
        scoring,
        animations,
        prefs
    }) => ({
        applyAnim() {
            return applyAnim({
                animations: animations(),
                documentRef,
                getById
            });
        },
        applyCardColor() {
            return applyCardColor({
                prefs: prefs(),
                ColorUtil,
                documentRef
            });
        },
        applyScoring() {
            return applyScoring({
                scoring: scoring(),
                getById
            });
        },
        applyViewMode() {
            return applyViewMode({
                mode: mode(),
                documentRef,
                getById
            });
        },
        toggleViewMode() {
            const nextMode = toggleViewMode(mode());
            setMode(nextMode);
            return nextMode;
        }
    });

    root.stateUi = {
        applyAnim,
        applyCardColor,
        applyScoring,
        applyViewMode,
        toggleViewMode,
        createUiRuntime
    };
})();
