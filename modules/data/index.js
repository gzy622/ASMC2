/**
 * 数据层模块入口
 * 导出所有数据相关功能
 */

export * from './storage.js';
export * from './models.js';
export * from './state.js';
export { default as StorageAdapter, storage, appStorage, LS } from './storage.js';
export { 
    IdGenerator, 
    Student, 
    StudentRecord, 
    Assignment, 
    Preferences, 
    RecoveryDraft 
} from './models.js';
export { default as AppState, state } from './state.js';
