import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useEffect, useRef } from 'react';
import {
  compressImageFile,
  estimateBase64Size,
  IMAGE_ERRORS,
} from '@/lib/clientImageUtils';

const EDITOR_MAX_WIDTH = 820;
const EDITOR_QUALITY = 0.62;
const MAX_EDITOR_BASE64_SIZE = 1 * 1024 * 1024; // ~1 MB per image to keep API payload small

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

  const prepareEditorImage = async (file) => {
    const dataUrl = await compressImageFile(file, {
      maxWidth: EDITOR_MAX_WIDTH,
      quality: EDITOR_QUALITY,
    });

    if (estimateBase64Size(dataUrl) > MAX_EDITOR_BASE64_SIZE) {
      const error = new Error(IMAGE_ERRORS.TOO_LARGE);
      error.code = IMAGE_ERRORS.TOO_LARGE;
      throw error;
    }

    return dataUrl;
  };

  const addImage = async (file) => {
    if (!editor) return;
    try {
      const dataUrl = await prepareEditorImage(file);
      editor
        .chain()
        .focus()
        .setImage({
          src: dataUrl,
          style: 'max-width: 480px; width: 100%; height: auto; display: block; margin: 1.5rem auto; border-radius: 12px;'
        })
        .run();
    } catch (error) {
      console.error('Impossible d’ajouter l’image dans le contenu :', error);
      if (error?.code === IMAGE_ERRORS.TOO_LARGE && typeof window !== 'undefined') {
        window.alert("Cette image est trop volumineuse pour être insérée dans l’article. Choisissez une image plus légère.");
      }
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
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
      <EditorContent
        editor={editor}
        className="editor-content p-4 min-h-[320px] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
