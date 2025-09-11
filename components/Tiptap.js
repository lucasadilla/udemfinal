'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'

export default function Tiptap({ value = '', onChange = () => {} }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    // Don't render immediately on the server to avoid SSR issues
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    }
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [editor, value])

  return <EditorContent editor={editor} />
}
