const { Injectable, NotFoundException, ForbiddenException, BadRequestException } = require('@nestjs/common');
const { leanId } = require('./tasks.helper');

@Injectable()
class MemosService {
  memoModel;
  taskModel;
  projectModel;
  userModel;
  tenantModel;

  async ensureSeed(tenantId, userId) {
    const seedEnabled =
      process.env.SEED_DEMO_DATA === 'true';
    if (!seedEnabled) return;

    const claimed = await this.tenantModel.findOneAndUpdate(
      { _id: tenantId, 'settings.memosSeeded': { $ne: true } },
      { $set: { 'settings.memosSeeded': true } },
      { new: true },
    );
    if (!claimed) return;

    await this.memoModel.insertMany([
      {
        tenantId,
        title: 'Q2 planning notes',
        content: '<p>Focus areas: product launch, hiring, and customer success expansion.</p>',
        status: 'draft',
        createdBy: userId,
      },
      {
        tenantId,
        title: 'Office policy update',
        content: '<p>Proposed remote work policy changes for review.</p>',
        status: 'pending',
        createdBy: userId,
      },
    ]);
  }

  async list(tenantId, userId, query = {}) {
    const filter = { tenantId };
    if (query.status) filter.status = query.status;

    const memos = await this.memoModel
      .find(filter)
      .sort({ updatedAt: -1 })
      .populate('createdBy', 'name email')
      .lean();

    return memos.map((m) => {
      const base = leanId(m);
      if (m.createdBy?._id) {
        base.author = { id: m.createdBy._id.toString(), name: m.createdBy.name, email: m.createdBy.email };
        base.createdBy = m.createdBy._id.toString();
      }
      base.canEdit = this.canEdit(m, userId);
      return base;
    });
  }

  canEdit(memo, userId) {
    if (memo.status === 'reviewed' && memo.createdBy?.toString() === userId.toString()) {
      return false;
    }
    return true;
  }

  async create(tenantId, userId, body) {
    const memo = await this.memoModel.create({
      tenantId,
      title: body.title,
      content: body.content || '',
      status: body.status || 'draft',
      createdBy: userId,
    });
    return this.findOne(tenantId, userId, memo._id.toString());
  }

  async findOne(tenantId, userId, id) {
    const memo = await this.memoModel.findOne({ _id: id, tenantId }).populate('createdBy', 'name email').lean();
    if (!memo) throw new NotFoundException('Memo not found');
    const base = leanId(memo);
    if (memo.createdBy?._id) {
      base.author = { id: memo.createdBy._id.toString(), name: memo.createdBy.name };
      base.createdBy = memo.createdBy._id.toString();
    }
    base.canEdit = this.canEdit(memo, userId);
    return base;
  }

  async update(tenantId, userId, id, body) {
    const memo = await this.memoModel.findOne({ _id: id, tenantId });
    if (!memo) throw new NotFoundException('Memo not found');

    if (!this.canEdit(memo, userId)) {
      throw new ForbiddenException('You cannot edit this memo after review');
    }

    if (body.title !== undefined) memo.title = body.title;
    if (body.content !== undefined) memo.content = body.content;
    if (body.status !== undefined) memo.status = body.status;

    await memo.save();
    return this.findOne(tenantId, userId, id);
  }

  async review(tenantId, userId, id) {
    const memo = await this.memoModel.findOne({ _id: id, tenantId });
    if (!memo) throw new NotFoundException('Memo not found');
    if (memo.status === 'reviewed') throw new BadRequestException('Memo already reviewed');

    memo.status = 'reviewed';
    memo.reviewedBy = userId;
    memo.reviewedAt = new Date();
    await memo.save();
    return this.findOne(tenantId, userId, id);
  }

  async convertToTask(tenantId, userId, id) {
    const memo = await this.memoModel.findOne({ _id: id, tenantId });
    if (!memo) throw new NotFoundException('Memo not found');

    const user = await this.userModel.findById(userId).lean();
    const task = await this.taskModel.create({
      tenantId,
      title: memo.title,
      description: memo.content?.replace(/<[^>]+>/g, ' ').trim() || '',
      status: 'todo',
      priority: 'medium',
      assignedTo: userId,
      assignees: [userId],
      createdBy: userId,
      workflowLog: [{ userId, userName: user?.name || 'User', action: 'created_from_memo', note: `Converted from memo: ${memo.title}` }],
    });

    memo.convertedToType = 'task';
    memo.convertedToId = task._id;
    await memo.save();

    return { taskId: task._id.toString(), memoId: id };
  }

  async convertToProject(tenantId, userId, id) {
    const memo = await this.memoModel.findOne({ _id: id, tenantId });
    if (!memo) throw new NotFoundException('Memo not found');

    const project = await this.projectModel.create({
      tenantId,
      name: memo.title,
      description: memo.content?.replace(/<[^>]+>/g, ' ').trim() || '',
      createdBy: userId,
    });

    memo.convertedToType = 'project';
    memo.convertedToId = project._id;
    await memo.save();

    return { projectId: project._id.toString(), memoId: id };
  }
}

module.exports = { MemosService };
