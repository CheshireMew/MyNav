import { ModalShell } from './ModalShell'

export function DataManagerModal({ onExport, onImport, onClose }) {
  return (
    <ModalShell>
      <h2>数据导入导出</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
        <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
          <h3>导出备份</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>将当前数据导出为 JSON 文件。</p>
          <button className="btn btn-primary" onClick={onExport}>导出 JSON</button>
        </div>
        <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
          <h3>导入恢复</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>支持当前 MyNav 备份和浏览器书签 JSON。</p>
          <input type="file" accept=".json" onChange={onImport} style={{ fontSize: '0.8rem' }} />
        </div>
        <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
          <h3>SEO 网站地图</h3>
          <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>查看 Sitemap</a>
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>关闭</button>
      </div>
    </ModalShell>
  )
}
