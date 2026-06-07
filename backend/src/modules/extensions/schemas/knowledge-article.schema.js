const { Schema } = require('mongoose');

const ARTICLE_STATUSES = ['draft', 'published', 'archived'];

const KnowledgeArticleSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, default: 'general', trim: true },
    content: { type: String, default: '' },
    status: { type: String, enum: ARTICLE_STATUSES, default: 'draft' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

KnowledgeArticleSchema.index({ tenantId: 1, status: 1, category: 1 });

module.exports = { KnowledgeArticleSchema, KnowledgeArticleModelName: 'KnowledgeArticle', ARTICLE_STATUSES };
