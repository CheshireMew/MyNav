import { ModalShell } from './ModalShell'

export function SiteSettingsModal({ form, setForm, onSubmit, onClose }) {
  return (
    <ModalShell as="form" onSubmit={onSubmit}>
      <h2>网站设置</h2>
      {[
        ['siteName', '网站名称'],
        ['siteLogo', '网站 Logo URL'],
        ['siteDescription', '网站描述'],
        ['pageTitle', '页面标题'],
        ['pageIcon', '页面图标 URL'],
        ['pageDescription', '页面描述']
      ].map(([key, label]) => (
        <div className="form-group" key={key}>
          <label>{label}</label>
          {key.includes('Description') ? (
            <textarea value={form[key]} onChange={event => setForm({ ...form, [key]: event.target.value })} rows={3} />
          ) : (
            <input value={form[key]} onChange={event => setForm({ ...form, [key]: event.target.value })} />
          )}
        </div>
      ))}
      <div className="modal-actions">
        <button type="button" className="btn" onClick={onClose}>取消</button>
        <button type="submit" className="btn btn-primary">保存</button>
      </div>
    </ModalShell>
  )
}
