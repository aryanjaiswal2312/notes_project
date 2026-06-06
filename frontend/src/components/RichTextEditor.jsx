import { Bold, Heading1, Image, Italic, Link, List, ListOrdered, Table, Underline } from "lucide-react";
import { useEffect, useRef } from "react";

const tools = [
  { label: "Bold", command: "bold", icon: Bold },
  { label: "Italic", command: "italic", icon: Italic },
  { label: "Underline", command: "underline", icon: Underline },
  { label: "Heading", command: "formatBlock", value: "h2", icon: Heading1 },
  { label: "Bullet list", command: "insertUnorderedList", icon: List },
  { label: "Numbered list", command: "insertOrderedList", icon: ListOrdered }
];

export default function RichTextEditor({ value, onChange }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  function run(command, commandValue = null) {
    document.execCommand(command, false, commandValue);
    editorRef.current?.focus();
    onChange(editorRef.current?.innerHTML || "");
  }

  function addLink() {
    const href = window.prompt("URL");
    if (href) run("createLink", href);
  }

  function addImage() {
    const src = window.prompt("Image URL");
    if (src) run("insertImage", src);
  }

  function addTable() {
    run("insertHTML", "<table><tbody><tr><th>Topic</th><th>Notes</th></tr><tr><td></td><td></td></tr></tbody></table><p></p>");
  }

  return (
    <div className="editor-shell">
      <div className="editor-toolbar" aria-label="Editor toolbar">
        {tools.map((tool) => (
          <button key={tool.label} className="icon-button" type="button" onClick={() => run(tool.command, tool.value)} title={tool.label}>
            <tool.icon size={17} />
          </button>
        ))}
        <button className="icon-button" type="button" onClick={addLink} title="Link">
          <Link size={17} />
        </button>
        <button className="icon-button" type="button" onClick={addImage} title="Image">
          <Image size={17} />
        </button>
        <button className="icon-button" type="button" onClick={addTable} title="Table">
          <Table size={17} />
        </button>
      </div>
      <div
        className="rich-editor"
        contentEditable
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
      />
    </div>
  );
}
