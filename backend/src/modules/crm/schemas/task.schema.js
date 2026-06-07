const { Schema } = require('mongoose');

const TASK_STATUSES = ['todo', 'in_progress', 'done'];
const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const SubtaskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    order: { type: Number, default: 0 },
  },
  { _id: true },
);

const WorkflowEntrySchema = new Schema(
  {
    at: { type: Date, default: Date.now },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    userName: { type: String, default: 'System' },
    action: { type: String, required: true },
    note: { type: String, default: '' },
  },
  { _id: true },
);

const TaskCommentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    userName: { type: String, default: 'User' },
    body: { type: String, required: true },
  },
  { timestamps: true },
);

const TaskSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: TASK_STATUSES, default: 'todo' },
    priority: { type: String, enum: TASK_PRIORITIES, default: 'medium' },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    assignees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    dueDate: { type: Date, default: null },
    nextStep: { type: String, default: '' },
    progress: { type: Number, default: 0 },
    subtasks: [SubtaskSchema],
    workflowLog: [WorkflowEntrySchema],
    comments: [TaskCommentSchema],
    hiddenForUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);

TaskSchema.index({ tenantId: 1, assignedTo: 1, dueDate: 1 });
TaskSchema.index({ tenantId: 1, projectId: 1, status: 1 });
TaskSchema.index({ tenantId: 1, status: 1, priority: 1 });

module.exports = {
  TaskSchema,
  TaskModelName: 'Task',
  TASK_STATUSES,
  TASK_PRIORITIES,
};
