const { Injectable, NotFoundException } = require('@nestjs/common');
const { leanId } = require('./tasks.helper');

@Injectable()
class ProjectsService {
  projectModel;
  taskModel;

  async list(tenantId) {
    const projects = await this.projectModel.find({ tenantId }).sort({ name: 1 }).lean();
    const counts = await this.taskModel.aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: '$projectId',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
        },
      },
    ]);

    const countMap = Object.fromEntries(
      counts.map((c) => [c._id?.toString(), { total: c.total, completed: c.completed }]),
    );

    return projects.map((p) => {
      const stats = countMap[p._id.toString()] || { total: 0, completed: 0 };
      return {
        ...leanId(p),
        taskTotal: stats.total,
        taskCompleted: stats.completed,
        progress: stats.total ? Math.round((stats.completed / stats.total) * 100) : 0,
      };
    });
  }

  async create(tenantId, userId, body) {
    const project = await this.projectModel.create({
      tenantId,
      name: body.name,
      description: body.description || '',
      color: body.color || '#4f46e5',
      createdBy: userId,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    });
    return { ...leanId(project.toObject()), taskTotal: 0, taskCompleted: 0, progress: 0 };
  }

  async findOne(tenantId, id) {
    const project = await this.projectModel.findOne({ _id: id, tenantId }).lean();
    if (!project) throw new NotFoundException('Project not found');
    const tasks = await this.taskModel.find({ tenantId, projectId: id }).sort({ status: 1, dueDate: 1 }).lean();
    const completed = tasks.filter((t) => t.status === 'done').length;
    return {
      ...leanId(project),
      taskTotal: tasks.length,
      taskCompleted: completed,
      progress: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
      tasks: tasks.map((t) => ({
        id: t._id.toString(),
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        progress: t.progress,
      })),
    };
  }
}

module.exports = { ProjectsService };
