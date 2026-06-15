const { Injectable, NotFoundException, BadRequestException } = require('@nestjs/common');
const { calcProgress, formatTask } = require('./tasks.helper');
const { emitNotification } = require('../../realtime/socket-hub');

const USER_POP = { path: 'assignedTo', select: 'name email' };
const ASSIGNEES_POP = { path: 'assignees', select: 'name email' };
const PROJECT_POP = { path: 'projectId', select: 'name color' };

@Injectable()
class TasksService {
  taskModel;
  projectModel;
  userModel;
  tenantModel;
  notificationModel;

  async ensureSeed(tenantId, userId) {
    const seedEnabled =
      process.env.SEED_DEMO_DATA === 'true';
    if (!seedEnabled) return;

    const claimed = await this.tenantModel.findOneAndUpdate(
      { _id: tenantId, 'settings.tasksSeeded': { $ne: true } },
      { $set: { 'settings.tasksSeeded': true } },
      { new: true },
    );
    if (!claimed) return;

    const day = (offset) => {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      d.setHours(17, 0, 0, 0);
      return d;
    };

    const projects = await this.projectModel.insertMany([
      { tenantId, name: 'Website Redesign', description: 'Q2 website overhaul', createdBy: userId, color: '#4f46e5' },
      { tenantId, name: 'Client Onboarding', description: 'New client setup flow', createdBy: userId, color: '#0ea5e9' },
    ]);

    await this.taskModel.insertMany([
      {
        tenantId,
        title: 'Design homepage mockups',
        description: 'Create 3 layout options for review',
        status: 'in_progress',
        priority: 'high',
        projectId: projects[0]._id,
        assignedTo: userId,
        assignees: [userId],
        createdBy: userId,
        dueDate: day(3),
        nextStep: 'Share mockups with stakeholders',
        subtasks: [
          { title: 'Wireframe hero section', completed: true, assignedTo: userId, order: 0 },
          { title: 'Mobile responsive layouts', completed: false, assignedTo: userId, order: 1 },
        ],
        workflowLog: [{ userId, userName: 'You', action: 'created', note: 'Task created' }],
        progress: 50,
      },
      {
        tenantId,
        title: 'Prepare onboarding checklist',
        status: 'todo',
        priority: 'medium',
        projectId: projects[1]._id,
        assignedTo: userId,
        assignees: [userId],
        createdBy: userId,
        dueDate: day(7),
        subtasks: [{ title: 'Draft checklist items', completed: false, assignedTo: userId, order: 0 }],
        workflowLog: [{ userId, userName: 'You', action: 'created', note: 'Task created' }],
        progress: 0,
      },
      {
        tenantId,
        title: 'Review analytics dashboard',
        status: 'done',
        priority: 'low',
        projectId: projects[0]._id,
        assignedTo: userId,
        assignees: [userId],
        createdBy: userId,
        dueDate: day(-2),
        progress: 100,
        workflowLog: [{ userId, userName: 'You', action: 'completed', note: 'Marked complete' }],
      },
    ]);
  }

  buildFilter(tenantId, userId, query) {
    const filter = { tenantId };

    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.projectId) filter.projectId = query.projectId;

    if (query.assignedToMe === 'true' || query.assignedToMe === '1') {
      filter.$or = [{ assignedTo: userId }, { assignees: userId }];
    }

    if (query.dueBefore) {
      filter.dueDate = { ...filter.dueDate, $lte: new Date(query.dueBefore) };
    }
    if (query.dueAfter) {
      filter.dueDate = { ...filter.dueDate, $gte: new Date(query.dueAfter) };
    }

    if (query.q) {
      const regex = new RegExp(query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const searchOr = [{ title: regex }, { description: regex }];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
        delete filter.$or;
      } else {
        filter.$or = searchOr;
      }
    }

    const showCompleted = query.showCompleted === 'true' || query.showCompleted === '1';
    if (!showCompleted) {
      filter.hiddenForUsers = { $nin: [userId] };
    }

    return filter;
  }

  async list(tenantId, userId, query = {}) {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 50, 1), 200);
    const skip = (page - 1) * limit;
    const filter = this.buildFilter(tenantId, userId, query);

    let sort = { dueDate: 1, createdAt: -1 };
    if (query.sort) {
      const desc = query.sort.startsWith('-');
      const field = desc ? query.sort.slice(1) : query.sort;
      sort = { [field]: desc ? -1 : 1 };
    }

    const [rows, total] = await Promise.all([
      this.taskModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate([USER_POP, ASSIGNEES_POP, PROJECT_POP])
        .lean(),
      this.taskModel.countDocuments(filter),
    ]);

    const data = rows.map(formatTask);

    if (query.view === 'kanban') {
      const columns = {
        todo: data.filter((t) => t.status === 'todo'),
        in_progress: data.filter((t) => t.status === 'in_progress'),
        done: data.filter((t) => t.status === 'done'),
      };
      return { columns, total, page, limit };
    }

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async create(tenantId, userId, body) {
    const user = await this.userModel.findById(userId).lean();
    const assignees = body.assignees?.length ? body.assignees : [userId];

    const task = await this.taskModel.create({
      tenantId,
      title: body.title,
      description: body.description || '',
      status: body.status || 'todo',
      priority: body.priority || 'medium',
      projectId: body.projectId || null,
      assignedTo: body.assignedTo || assignees[0] || userId,
      assignees,
      createdBy: userId,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      nextStep: body.nextStep || '',
      subtasks: body.subtasks || [],
      progress: calcProgress(body.subtasks || []),
      workflowLog: [{ userId, userName: user?.name || 'User', action: 'created', note: 'Task created' }],
    });

    await this.notifyAssignees(tenantId, task, 'Task assigned to you', userId);
    return this.findOne(tenantId, task._id.toString());
  }

  async findOne(tenantId, id) {
    const task = await this.taskModel
      .findOne({ _id: id, tenantId })
      .populate([USER_POP, ASSIGNEES_POP, PROJECT_POP])
      .lean();
    if (!task) throw new NotFoundException('Task not found');
    return formatTask(task);
  }

  async update(tenantId, userId, id, body) {
    const task = await this.taskModel.findOne({ _id: id, tenantId });
    if (!task) throw new NotFoundException('Task not found');

    const user = await this.userModel.findById(userId).lean();
    const userName = user?.name || 'User';
    const previousStatus = task.status;
    const allowed = ['title', 'description', 'status', 'priority', 'projectId', 'assignedTo', 'assignees', 'dueDate'];

    for (const key of allowed) {
      if (body[key] !== undefined) task[key] = body[key];
    }

    if (body.status && body.status !== previousStatus) {
      task.workflowLog.push({
        userId,
        userName,
        action: 'status_changed',
        note: `Status changed to ${body.status}`,
      });
    }

    if (body.nextStep !== undefined && body.nextStep !== task.nextStep) {
      const prev = task.nextStep;
      task.nextStep = body.nextStep;
      task.workflowLog.push({
        userId,
        userName,
        action: 'next_step_updated',
        note: body.nextStep ? `Next step: ${body.nextStep}` : `Cleared next step (was: ${prev})`,
      });
    }

    task.progress = calcProgress(task.subtasks);
    await task.save();
    return this.findOne(tenantId, id);
  }

  async notifyAssignees(tenantId, task, title, excludeUserId) {
    if (!this.notificationModel) return;
    const assignees = task.assignees?.length ? task.assignees : task.assignedTo ? [task.assignedTo] : [];
    for (const uid of assignees) {
      if (String(uid) === String(excludeUserId)) continue;
      const note = await this.notificationModel.create({
        tenantId,
        userId: uid,
        type: 'task_assigned',
        title,
        body: task.title,
        href: '/tasks',
        entityType: 'Task',
        entityId: task._id,
        read: false,
      });
      emitNotification(tenantId, String(uid), {
        id: note._id.toString(),
        title,
        body: task.title,
        href: '/tasks',
        read: false,
        createdAt: note.createdAt,
      });
    }
  }

  async manageSubtasks(tenantId, userId, id, body) {
    const task = await this.taskModel.findOne({ _id: id, tenantId });
    if (!task) throw new NotFoundException('Task not found');

    const user = await this.userModel.findById(userId).lean();
    const userName = user?.name || 'User';
    const { action, subtask } = body;

    switch (action) {
      case 'add':
        if (!subtask?.title) throw new BadRequestException('Subtask title required');
        task.subtasks.push({
          title: subtask.title,
          completed: false,
          assignedTo: subtask.assignedTo || userId,
          order: task.subtasks.length,
        });
        task.workflowLog.push({ userId, userName, action: 'subtask_added', note: `Added subtask: ${subtask.title}` });
        break;
      case 'update':
        if (!subtask?.id) throw new BadRequestException('Subtask id required');
        {
          const st = task.subtasks.id(subtask.id);
          if (!st) throw new NotFoundException('Subtask not found');
          if (subtask.title !== undefined) st.title = subtask.title;
          if (subtask.assignedTo !== undefined) st.assignedTo = subtask.assignedTo;
          if (subtask.order !== undefined) st.order = subtask.order;
        }
        break;
      case 'toggle':
        if (!subtask?.id) throw new BadRequestException('Subtask id required');
        {
          const st = task.subtasks.id(subtask.id);
          if (!st) throw new NotFoundException('Subtask not found');
          st.completed = subtask.completed !== undefined ? subtask.completed : !st.completed;
          task.workflowLog.push({
            userId,
            userName,
            action: st.completed ? 'subtask_completed' : 'subtask_reopened',
            note: `${st.completed ? 'Completed' : 'Reopened'} subtask: ${st.title}`,
          });
        }
        break;
      case 'delete':
        if (!subtask?.id) throw new BadRequestException('Subtask id required');
        {
          const st = task.subtasks.id(subtask.id);
          if (!st) throw new NotFoundException('Subtask not found');
          task.workflowLog.push({ userId, userName, action: 'subtask_deleted', note: `Removed subtask: ${st.title}` });
          st.deleteOne();
        }
        break;
      default:
        throw new BadRequestException(`Unknown subtask action: ${action}`);
    }

    task.progress = calcProgress(task.subtasks);
    if (task.progress === 100 && task.status !== 'done') {
      task.status = 'done';
      task.workflowLog.push({ userId, userName, action: 'auto_completed', note: 'All subtasks completed' });
    }
    await task.save();
    return this.findOne(tenantId, id);
  }

  async addComment(tenantId, userId, id, { body }) {
    const task = await this.taskModel.findOne({ _id: id, tenantId });
    if (!task) throw new NotFoundException('Task not found');
    const user = await this.userModel.findById(userId).lean();
    task.comments.push({ userId, userName: user?.name || 'User', body });
    await task.save();
    return this.findOne(tenantId, id);
  }

  async toggleHideForMe(tenantId, userId, id) {
    const task = await this.taskModel.findOne({ _id: id, tenantId });
    if (!task) throw new NotFoundException('Task not found');

    const mySubtasks = task.subtasks.filter(
      (s) => s.assignedTo && s.assignedTo.toString() === userId.toString(),
    );
    if (mySubtasks.length && !mySubtasks.every((s) => s.completed)) {
      throw new BadRequestException('Complete all your subtasks before hiding this task');
    }

    const idx = task.hiddenForUsers.findIndex((uid) => uid.toString() === userId.toString());
    if (idx >= 0) {
      task.hiddenForUsers.splice(idx, 1);
    } else {
      task.hiddenForUsers.push(userId);
    }
    await task.save();
    return { hidden: idx < 0, taskId: id };
  }
}

module.exports = { TasksService };
