(() => {
    const root = globalThis.__AC2_INTERNALS__ || (globalThis.__AC2_INTERNALS__ = {});

    const getAsgSubject = ({ asg, useAssignmentService, assignmentService }) => {
        if (useAssignmentService && asg) return assignmentService.getSubject(asg);
        return String(asg?.subject || '').trim() || (/英语/.test(asg?.name || '') ? '英语' : '其他');
    };

    const isEnglishAsg = ({ asg, useAssignmentService, assignmentService, getAsgSubject }) => {
        if (useAssignmentService && asg) return assignmentService.isEnglish(asg);
        return getAsgSubject(asg) === '英语';
    };

    const isStuIncluded = ({ asg, stu, isEnglishAsg }) => !(isEnglishAsg(asg) && stu.noEnglish);

    const invertCurrentSelection = ({ asg, roster, isStuIncluded }) => {
        if (!asg) return false;
        const records = asg.records || (asg.records = {});
        for (const stu of roster) {
            if (!isStuIncluded(asg, stu)) continue;
            const id = stu.id;
            const nextDone = !records[id]?.done;
            records[id] = { ...(records[id] || {}), done: nextDone };
            if (!records[id].done && (records[id].score == null || records[id].score === '')) delete records[id];
        }
        return true;
    };

    const addAsg = ({
        name,
        useAssignmentService,
        assignmentService,
        data,
        asgMap,
        normalizeAsg,
        createUniqueId
    }) => {
        if (useAssignmentService) {
            assignmentService.create(name);
            return {
                changed: true,
                data: assignmentService.getAll(),
                curId: assignmentService.getCurrentId()
            };
        }

        const id = createUniqueId(candidate => asgMap.has(candidate));
        const nextData = data.concat(normalizeAsg({ id, name: (name || '').trim() || '未命名任务', subject: '英语', records: {} }));
        return { changed: true, data: nextData, curId: id };
    };

    const selectAsg = ({ id, useAssignmentService, assignmentService, asgMap }) => {
        if (useAssignmentService) {
            if (!assignmentService.has(id)) return { changed: false };
            assignmentService.select(id);
            return { changed: true, curId: assignmentService.getCurrentId() };
        }
        if (!asgMap.has(id)) return { changed: false };
        return { changed: true, curId: id };
    };

    const renameAsg = ({ id, name, useAssignmentService, assignmentService, data, asgMap }) => {
        if (useAssignmentService) {
            const changed = assignmentService.rename(id, name);
            return { changed, data: changed ? assignmentService.getAll() : data };
        }
        const asg = asgMap.get(id);
        if (!asg || !(name || '').trim()) return { changed: false, data };
        asg.name = name.trim();
        return { changed: true, data };
    };

    const updateAsgMeta = ({
        id,
        payload,
        useAssignmentService,
        assignmentService,
        data,
        asgMap,
        getAsgSubject
    }) => {
        if (useAssignmentService) {
            const currentAsg = asgMap.get(id);
            const prevSubject = getAsgSubject(currentAsg);
            const changed = assignmentService.updateMeta(id, payload);
            const nextData = changed ? assignmentService.getAll() : data;
            const nextAsg = changed ? nextData.find(item => item.id === id) : currentAsg;
            const nextSubject = nextAsg ? getAsgSubject(nextAsg) : prevSubject;
            return { changed, data: nextData, prevSubject, nextSubject };
        }
        const asg = asgMap.get(id);
        if (!asg) return { changed: false, data };
        const safeName = String(payload.name ?? asg.name).trim();
        const safeSubject = String(payload.subject ?? asg.subject ?? '').trim() || '英语';
        if (!safeName) return { changed: false, data };
        const prevSubject = getAsgSubject(asg);
        Object.assign(asg, { name: safeName, subject: safeSubject });
        return { changed: true, data, prevSubject, nextSubject: safeSubject };
    };

    const removeAsg = ({ id, data, curId, useAssignmentService, assignmentService }) => {
        if (data.length <= 1) return { changed: false, data, curId };
        if (useAssignmentService) {
            const changed = assignmentService.remove(id);
            return {
                changed,
                data: changed ? assignmentService.getAll() : data,
                curId: changed ? assignmentService.getCurrentId() : curId
            };
        }
        const idx = data.findIndex(a => a.id === id);
        if (idx === -1) return { changed: false, data, curId };
        const nextData = data.slice();
        nextData.splice(idx, 1);
        const nextCurId = curId === id ? (nextData[Math.max(0, idx - 1)] || nextData[0]).id : curId;
        return { changed: true, data: nextData, curId: nextCurId };
    };

    const updRec = ({ asg, id, val }) => {
        if (!asg) return { changed: false, prevDone: false };
        const prevRecord = asg.records[id] ? { ...asg.records[id] } : null;
        const prevDone = !!prevRecord?.done;
        const records = asg.records;
        records[id] = { ...records[id], ...val };
        if (!records[id].done && (records[id].score == null || records[id].score === '')) delete records[id];
        return { changed: true, prevDone, nextDone: !!records[id]?.done };
    };

    const createAssignmentRuntime = ({
        useAssignmentService,
        assignmentService,
        data = [],
        asgMap = new Map(),
        curId = null,
        normalizeAsg,
        createUniqueId
    }) => ({
        getAsgSubject(asg) {
            return getAsgSubject({ asg, useAssignmentService, assignmentService });
        },
        isEnglishAsg(asg) {
            return isEnglishAsg({
                asg,
                useAssignmentService,
                assignmentService,
                getAsgSubject: targetAsg => this.getAsgSubject(targetAsg)
            });
        },
        isStuIncluded(asg, stu) {
            return isStuIncluded({
                asg,
                stu,
                isEnglishAsg: targetAsg => this.isEnglishAsg(targetAsg)
            });
        },
        addAsg(name) {
            return addAsg({
                name,
                useAssignmentService,
                assignmentService,
                data,
                asgMap,
                normalizeAsg,
                createUniqueId
            });
        },
        selectAsg(id) {
            return selectAsg({
                id,
                useAssignmentService,
                assignmentService,
                asgMap
            });
        },
        renameAsg(id, name) {
            return renameAsg({
                id,
                name,
                useAssignmentService,
                assignmentService,
                data,
                asgMap
            });
        },
        updateAsgMeta(id, payload) {
            return updateAsgMeta({
                id,
                payload,
                useAssignmentService,
                assignmentService,
                data,
                asgMap,
                getAsgSubject: asg => this.getAsgSubject(asg)
            });
        },
        removeAsg(id) {
            return removeAsg({
                id,
                data,
                curId,
                useAssignmentService,
                assignmentService
            });
        },
        updRec(asg, id, val) {
            return updRec({ asg, id, val });
        }
    });

    root.stateAssignment = {
        getAsgSubject,
        isEnglishAsg,
        isStuIncluded,
        invertCurrentSelection,
        createAssignmentRuntime,
        addAsg,
        selectAsg,
        renameAsg,
        updateAsgMeta,
        removeAsg,
        updRec
    };
})();
