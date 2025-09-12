import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useEffect, useRef } from 'react';

export default function RichTextEditor({ value = '', onChange = () => {} }) {
  const fileInput = useRef(null);
  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: value,
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  const addImage = (file) => {
    if (!editor) return;
    const reader = new FileReader();
    reader.onload = () => {
      // Limit image size to prevent oversized images in the editor and saved content
      editor
        .chain()
        .focus()
        .setImage({
          src: reader.result,
          style: 'max-width: 300px; height: auto;'
        })
        .run();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-2 border-b">
        <button
          type="button"
          onClick={() => editor && editor.chain().focus().toggleBold().run()}
          className={`p-1 rounded ${editor?.isActive('bold') ? 'bg-gray-200' : ''}`}
        >
          <b>B</b>
        </button>
        <button
          type="button"
          onClick={() => editor && editor.chain().focus().toggleItalic().run()}
          className={`p-1 rounded ${editor?.isActive('italic') ? 'bg-gray-200' : ''}`}
        >
          <i>I</i>
        </button>
        <button
          type="button"
          onClick={() => editor && editor.chain().focus().toggleBulletList().run()}
          className={`p-1 rounded ${editor?.isActive('bulletList') ? 'bg-gray-200' : ''}`}
        >
          •
        </button>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="p-1 rounded"
        >
          📷
        </button>
        <input
          type="file"
          accept="image/*"
          ref={fileInput}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) addImage(file);
            e.target.value = '';
          }}
        />
      </div>
      <EditorContent editor={editor} className="p-2 min-h-[200px] bg-[#e8e0e0]" />
    </div>
  );
}
