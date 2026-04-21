(() => {
    const root = globalThis.__AC2_INTERNALS__ || (globalThis.__AC2_INTERNALS__ = {});

    const parseRosterLine = ({ rawLine, useRosterService, rosterService }) => {
        if (useRosterService) return rosterService.parseLine(rawLine);
        const lineText = String(rawLine ?? '').trim();
        const noEnRegex = /\s*#(?:非英语|非英|no-en|noeng|not-en)\s*$/i;
        const noEnglish = noEnRegex.test(lineText);
        const line = lineText.replace(noEnRegex, '').trim();
        const index = line.indexOf(' ');
        return index === -1 ? { id: line, name: '', noEnglish } : { id: line.slice(0, index), name: line.slice(index + 1), noEnglish };
    };

    const getDuplicateIds = ({ ids, useRosterService, rosterService }) => {
        if (useRosterService) return rosterService.getDuplicateIds?.(ids) ?? [];
        const seen = new Set();
        const dup = new Set();
        ids.forEach(id => {
            const key = String(id || '').trim();
            if (!key) return;
            if (seen.has(key)) dup.add(key);
            seen.add(key);
        });
        return Array.from(dup);
    };

    const assertUniqueRosterIds = ({ ids, sourceLabel = '名单', useRosterService, rosterService }) => {
        if (useRosterService) {
            rosterService.assertUniqueIds?.(ids, sourceLabel);
            return;
        }
        const dup = getDuplicateIds({ ids, useRosterService, rosterService });
        if (dup.length) throw new Error(`${sourceLabel}存在重复学号: ${dup.join('、')}`);
    };

    const parseRoster = ({
        list,
        useRosterService,
        rosterService,
        previousRosterVersion
    }) => {
        if (useRosterService) {
            rosterService.parse(list);
            const roster = rosterService.getAllStudents();
            return {
                roster,
                rosterIndexMap: new Map(roster.map((stu, index) => [stu.id, index])),
                noEnglishIds: roster.filter(stu => stu.noEnglish).map(stu => stu.id),
                rosterVersion: rosterService.getVersion()
            };
        }

        const roster = list.map(line => parseRosterLine({ rawLine: line, useRosterService, rosterService })).filter(stu => stu.id);
        assertUniqueRosterIds({ ids: roster.map(stu => stu.id), sourceLabel: '名单', useRosterService, rosterService });
        return {
            roster,
            rosterIndexMap: new Map(roster.map((stu, index) => [stu.id, index])),
            noEnglishIds: roster.filter(stu => stu.noEnglish).map(stu => stu.id),
            rosterVersion: previousRosterVersion + 1
        };
    };

    const createRosterRuntime = ({
        useRosterService,
        rosterService,
        list = [],
        previousRosterVersion = 0
    }) => ({
        parseRosterLine(rawLine) {
            return parseRosterLine({ rawLine, useRosterService, rosterService });
        },
        getDuplicateIds(ids) {
            return getDuplicateIds({ ids, useRosterService, rosterService });
        },
        assertUniqueRosterIds(ids, sourceLabel = '名单') {
            return assertUniqueRosterIds({ ids, sourceLabel, useRosterService, rosterService });
        },
        parseRoster() {
            return parseRoster({
                list,
                useRosterService,
                rosterService,
                previousRosterVersion
            });
        }
    });

    root.stateRoster = {
        parseRosterLine,
        getDuplicateIds,
        assertUniqueRosterIds,
        parseRoster,
        createRosterRuntime
    };
})();
