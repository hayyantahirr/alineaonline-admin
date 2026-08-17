"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Unlink,
  ImageIcon,
  CodeXml,
  Eye,
  Loader2,
} from "lucide-react";

// ─── Toolbar Button ─────────────────────────────────────────────
function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-2 rounded-lg transition-all duration-150 cursor-pointer
        ${
          isActive
            ? "bg-dark text-white shadow-sm"
            : "text-gray-500 hover:bg-gray-100 hover:text-dark"
        }
        ${disabled ? "opacity-40 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

// ─── Toolbar Divider ────────────────────────────────────────────
function ToolbarDivider() {
  return <div className="w-px h-6 bg-gray-200 mx-1" />;
}

// ─── Blog Editor ────────────────────────────────────────────────
export default function BlogEditor({ content = "", onChange }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlCode, setHtmlCode] = useState(content || "");
  const fileInputRef = useRef(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: false,
        code: false,
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class:
            "text-info underline underline-offset-2 hover:text-blue-800 transition-colors",
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "rounded-lg max-w-full mx-auto my-4",
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none min-h-[320px] px-5 py-4 focus:outline-none text-dark",
      },
      // Smart paste handler: if pasted plain text is raw HTML markup, parse and insert it properly
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData("text/plain");
        const html = event.clipboardData?.getData("text/html");

        // If no rich HTML clipboard payload exists, but plain text contains HTML tags
        if (!html && text && /<[a-z][\s\S]*>/i.test(text.trim())) {
          event.preventDefault();
          editor?.commands.insertContent(text.trim());
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const newHtml = editor.getHTML();
      setHtmlCode(newHtml);
      onChange?.(newHtml);
    },
  });

  // Sync content prop changes (e.g. when switching between create/edit)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
      setHtmlCode(content || "");
    }
  }, [content]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Toggle HTML Source Mode ──────────────────────────────────
  const toggleHtmlMode = () => {
    if (isHtmlMode) {
      // Switching from HTML mode -> Visual WYSIWYG mode
      if (editor) {
        editor.commands.setContent(htmlCode || "");
      }
      onChange?.(htmlCode);
      setIsHtmlMode(false);
    } else {
      // Switching from Visual mode -> HTML mode
      if (editor) {
        setHtmlCode(editor.getHTML());
      }
      setIsHtmlMode(true);
    }
  };

  const handleHtmlCodeChange = (e) => {
    const val = e.target.value;
    setHtmlCode(val);
    onChange?.(val);
  };

  // ─── Link Insertion ─────────────────────────────────────────
  const handleLinkInsert = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl || "https://");

    if (url === null) return; // cancelled
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  // ─── Image Upload ───────────────────────────────────────────
  const handleImageUpload = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;

      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const data = await res.json();

        if (data.url) {
          editor
            .chain()
            .focus()
            .setImage({ src: data.url, alt: file.name })
            .run();
        }
      } catch (error) {
        console.error("Image upload error:", error);
        alert("Failed to upload image: " + error.message);
      } finally {
        setIsUploading(false);
        // Reset file input so the same file can be re-selected
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [editor],
  );

  if (!editor) {
    return (
      <div className="w-full rounded-xl border border-gray-200 bg-white min-h-100 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white overflow-hidden transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-1 px-3 py-2 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center flex-wrap gap-0.5">
          {/* Text Formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            disabled={isHtmlMode}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            disabled={isHtmlMode}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Headings */}
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            isActive={editor.isActive("heading", { level: 2 })}
            disabled={isHtmlMode}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            isActive={editor.isActive("heading", { level: 3 })}
            disabled={isHtmlMode}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={editor.isActive("paragraph")}
            disabled={isHtmlMode}
            title="Paragraph"
          >
            <Pilcrow className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            disabled={isHtmlMode}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            disabled={isHtmlMode}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            disabled={isHtmlMode}
            title="Blockquote"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Link */}
          <ToolbarButton
            onClick={handleLinkInsert}
            isActive={editor.isActive("link")}
            disabled={isHtmlMode}
            title="Insert Link"
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
          {editor.isActive("link") && !isHtmlMode && (
            <ToolbarButton
              onClick={() => editor.chain().focus().unsetLink().run()}
              title="Remove Link"
            >
              <Unlink className="w-4 h-4" />
            </ToolbarButton>
          )}

          <ToolbarDivider />

          {/* Image Upload */}
          <ToolbarButton
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isHtmlMode}
            title="Insert Image"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4" />
            )}
          </ToolbarButton>

          {isUploading && (
            <span className="text-xs text-gray-400 ml-1 font-(family-name:--font-ibm-plex-mono)">
              Uploading...
            </span>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Mode Switcher: Visual vs HTML Source Code */}
        <button
          type="button"
          onClick={toggleHtmlMode}
          className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border
            ${
              isHtmlMode
                ? "bg-dark text-white border-dark shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-dark"
            }
          `}
          title={
            isHtmlMode ? "Switch to Visual Editor" : "Edit Raw HTML Source"
          }
        >
          {isHtmlMode ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>Visual Mode</span>
            </>
          ) : (
            <>
              <CodeXml className="w-3.5 h-3.5" />
              <span>HTML Source</span>
            </>
          )}
        </button>
      </div>

      {/* Editor Content or Raw HTML View */}
      {isHtmlMode ? (
        <div className="p-3 bg-gray-900 min-h-80">
          <textarea
            value={htmlCode}
            onChange={handleHtmlCodeChange}
            placeholder="Paste or write raw HTML here..."
            spellCheck={false}
            className="w-full min-h-75 p-3 text-xs font-(family-name:--font-ibm-plex-mono) text-emerald-400 bg-transparent border-0 outline-none resize-y leading-relaxed"
          />
        </div>
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
}
