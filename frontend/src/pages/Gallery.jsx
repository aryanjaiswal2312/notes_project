import { Download, FileUp, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api, assetUrl } from "../api/client";

export default function Gallery({ setMessage }) {
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState("General");
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadFiles().catch((error) => setMessage(error.message, "error"));
  }, [setMessage]);

  async function loadFiles() {
    setFiles(await api.gallery.list());
  }

  async function upload(event) {
    event.preventDefault();
    try {
      if (!file) {
        setMessage("Select a file first.", "error");
        return;
      }
      const data = new FormData();
      data.append("file", file);
      data.append("category", category);
      data.append("description", description);
      await api.gallery.upload(data);
      setFile(null);
      setDescription("");
      await loadFiles();
      setMessage("File uploaded.");
    } catch (error) {
      setMessage(error.message, "error");
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete file?")) return;
    try {
      await api.gallery.remove(id);
      await loadFiles();
      setMessage("File deleted.");
    } catch (error) {
      setMessage(error.message, "error");
    }
  }

  return (
    <div className="page-stack">
      <form className="panel upload-panel" onSubmit={upload}>
        <div className="panel-head">
          <h2>Study Resources</h2>
          <button className="primary-button" type="submit" disabled={!file}>
            <FileUp size={16} />
            Upload
          </button>
        </div>
        <div className="form-grid compact">
          <label className="file-control">
            <FileUp size={17} />
            <span>{file?.name || "Select file"}</span>
            <input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>
          <label>
            Category
            <input value={category} onChange={(event) => setCategory(event.target.value)} />
          </label>
          <label className="span-2">
            Description
            <input value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
        </div>
      </form>

      <section className="list-grid">
        {files.map((item) => (
          <article className="item-card resource-card" key={item.id}>
            <div className="resource-preview">
              {item.mimeType?.startsWith("image/") ? <img src={assetUrl(item.url)} alt="" /> : <FileUp size={28} />}
            </div>
            <div>
              <h3>{item.originalName}</h3>
              <p>{item.description || item.category}</p>
              <span className="muted">{formatSize(item.size)}</span>
            </div>
            <div className="button-row">
              <a className="secondary-button" href={api.gallery.downloadUrl(item.id)}>
                <Download size={15} />
                Download
              </a>
              <button className="danger-button" type="button" onClick={() => remove(item.id)}>
                <Trash2 size={15} />
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>
      {!files.length && <p className="empty-state">No resources uploaded.</p>}
    </div>
  );
}

function formatSize(size = 0) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
