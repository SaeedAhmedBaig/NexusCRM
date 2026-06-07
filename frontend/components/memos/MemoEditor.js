'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

export function MemoEditor({ content, onChange, editable = true }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || '',
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => onChange?.(ed.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[200px] px-4 py-3 focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== undefined && editor.getHTML() !== content) {
      editor.commands.setContent(content || '', false);
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) editor.setEditable(editable);
  }, [editable, editor]);

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {editable && (
        <div className="flex flex-wrap gap-1 border-b border-border bg-surface-elevated px-2 py-1.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`rounded-lg px-2 py-1 text-xs font-semibold ${editor.isActive('bold') ? 'bg-brand text-white' : 'text-muted hover:bg-surface'}`}
          >
            B
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`rounded-lg px-2 py-1 text-xs italic ${editor.isActive('italic') ? 'bg-brand text-white' : 'text-muted hover:bg-surface'}`}
          >
            I
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`rounded-lg px-2 py-1 text-xs ${editor.isActive('bulletList') ? 'bg-brand text-white' : 'text-muted hover:bg-surface'}`}
          >
            • List
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
