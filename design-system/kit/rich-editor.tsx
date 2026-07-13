"use client"

import * as React from "react"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { RiBold as Bold, RiItalic as Italic, RiUnderline as Underline, RiStrikethrough as Strikethrough, RiListUnordered as List, RiListOrdered as ListOrdered, RiDoubleQuotesL as Quote, RiLinkM as Link2, RiArrowGoBackLine as Undo2, RiArrowGoForwardLine as Redo2, RiH2 as Heading2, RiCodeLine as CodeIcon } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * RichEditor — Tiptap-powered editor with Dash-styled toolbar.
 * Composable: render <RichEditor /> with content + onChange OR use useRichEditor()
 * hook to drive externally.
 */

type RichEditorProps = {
  content?: string
  defaultContent?: string
  placeholder?: string
  onChange?: (html: string) => void
  disabled?: boolean
  className?: string
  /** Toolbar variant: "full" (default) shows all actions, "compact" shows essentials. */
  toolbar?: "full" | "compact" | "none"
}

export function RichEditor({
  content,
  defaultContent,
  placeholder = "Tulis sesuatu…",
  onChange,
  disabled,
  className,
  toolbar = "full",
}: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-(--primary-base) underline underline-offset-4" } }),
      Placeholder.configure({ placeholder }),
    ],
    content: content ?? defaultContent ?? "",
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    editorProps: {
      attributes: {
        class: cn(
          "min-h-32 px-4 py-3 text-sm text-text-strong-950 outline-none prose prose-sm max-w-none",
          "prose-headings:font-semibold prose-headings:tracking-tight",
          "prose-a:text-(--primary-base) prose-strong:text-text-strong-950",
          "[&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
          "[&_p.is-editor-empty:first-child]:before:text-text-soft-400",
          "[&_p.is-editor-empty:first-child]:before:float-left",
          "[&_p.is-editor-empty:first-child]:before:pointer-events-none",
          "[&_p.is-editor-empty:first-child]:before:h-0",
        ),
      },
    },
  })

  // Sync controlled content prop with editor (only when external content changes).
  React.useEffect(() => {
    if (editor && content !== undefined && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content])

  if (!editor) {
    return (
      <div
        className={cn(
          "flex flex-col rounded-lg border border-stroke-soft-200 bg-bg-white-0 min-h-32",
          className,
        )}
        aria-busy
      />
    )
  }

  return (
    <div
      data-slot="rich-editor"
      className={cn(
        "flex flex-col rounded-lg border border-stroke-soft-200 bg-bg-white-0 overflow-hidden",
        "focus-within:border-stroke-strong-950",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
    >
      {toolbar !== "none" ? <RichEditorToolbar editor={editor} variant={toolbar} /> : null}
      <EditorContent editor={editor} />
    </div>
  )
}

type ToolbarBtnProps = {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  label: string
  children: React.ReactNode
}

const ToolbarBtn = ({ onClick, active, disabled, label, children }: ToolbarBtnProps) => (
  <button
    type="button"
    aria-label={label}
    aria-pressed={active}
    disabled={disabled}
    onClick={onClick}
    className={cn(
      "inline-flex size-7 items-center justify-center rounded-md text-icon-sub-600",
      "transition-colors duration-(--duration-fast) ease-(--ease-out)",
      "hover:bg-bg-weak-50 hover:text-text-strong-950",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-alpha-10)",
      "disabled:opacity-40 disabled:pointer-events-none",
      "aria-pressed:bg-bg-weak-50 aria-pressed:text-text-strong-950",
    )}
  >
    {children}
  </button>
)

const Sep = () => <span aria-hidden className="mx-1 h-4 w-px bg-stroke-soft-200" />

const RichEditorToolbar = ({ editor, variant = "full" }: { editor: Editor; variant?: "full" | "compact" }) => {
  const compact = variant === "compact"
  return (
    <div
      role="toolbar"
      aria-label="Editor toolbar"
      className="flex items-center flex-wrap gap-0.5 px-1 py-0.5 border-b border-stroke-soft-200 bg-bg-white-0"
    >
      <ToolbarBtn label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold strokeWidth={1.75} className="size-4" />
      </ToolbarBtn>
      <ToolbarBtn label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic strokeWidth={1.75} className="size-4" />
      </ToolbarBtn>
      <ToolbarBtn label="Strike" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough strokeWidth={1.75} className="size-4" />
      </ToolbarBtn>
      <ToolbarBtn label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline?.().run() ?? null}>
        <Underline strokeWidth={1.75} className="size-4" />
      </ToolbarBtn>

      {!compact ? (
        <>
          <Sep />
          <ToolbarBtn label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 strokeWidth={1.75} className="size-4" />
          </ToolbarBtn>
          <ToolbarBtn label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote strokeWidth={1.75} className="size-4" />
          </ToolbarBtn>
          <ToolbarBtn label="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
            <CodeIcon strokeWidth={1.75} className="size-4" />
          </ToolbarBtn>
        </>
      ) : null}

      <Sep />
      <ToolbarBtn label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List strokeWidth={1.75} className="size-4" />
      </ToolbarBtn>
      <ToolbarBtn label="Ordered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered strokeWidth={1.75} className="size-4" />
      </ToolbarBtn>

      <Sep />
      <ToolbarBtn
        label="Link"
        active={editor.isActive("link")}
        onClick={() => {
          const prev = editor.getAttributes("link").href as string | undefined
          const url = window.prompt("URL", prev ?? "https://")
          if (url === null) return
          if (url === "") {
            editor.chain().focus().unsetLink().run()
            return
          }
          editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
        }}
      >
        <Link2 strokeWidth={1.75} className="size-4" />
      </ToolbarBtn>

      <Sep />
      <ToolbarBtn label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 strokeWidth={1.75} className="size-4" />
      </ToolbarBtn>
      <ToolbarBtn label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 strokeWidth={1.75} className="size-4" />
      </ToolbarBtn>
    </div>
  )
}

/** Hook for advanced control. Use when you need imperative editor access. */
export function useRichEditor(opts?: { placeholder?: string; content?: string; onChange?: (html: string) => void }) {
  return useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: opts?.placeholder ?? "Tulis sesuatu…" }),
    ],
    content: opts?.content ?? "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => opts?.onChange?.(editor.getHTML()),
  })
}

export { RichEditorToolbar }
