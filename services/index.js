/**
 * 服务模块索引
 * 集中导出所有服务模块
 *
 * 这是服务层的统一入口
 */

// 确保服务已经通过 index.html 按顺序加载脚本
// 所以这里不需要再引入，只是提供一个统一的命名空间

const Services = {
    CacheService,
    RosterService,
    AssignmentService,
    PreferenceService,
    PersistenceService
};

// 导出到全局
if (typeof window !== 'undefined') {
    window.Services = Services;
}

// 为了保持向后兼容，也确保服务通过直接访问
// 保持原有的服务名称已经在 index.html 中被加载，
