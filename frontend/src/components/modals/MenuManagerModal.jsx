import { IconInput } from '../IconInput'
import { IconView } from '../IconView'
import { ModalShell } from './ModalShell'

export function MenuManagerModal({ menuLinks, form, setForm, editing, onEdit, onSubmit, onDelete, onReorder, onCancelEdit, onClose }) {
  return (
    <ModalShell style={{ maxWidth: '640px' }}>
      <h2>顶部菜单管理</h2>
      <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
        {menuLinks.map((link, index) => (
          <div key={link.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>
            <span><IconView icon={link.icon} /> {link.title}</span>
            <div>
              <button className="tiny-btn" disabled={index === 0} onClick={() => onReorder(link.id, 'up')}>↑</button>
              <button className="tiny-btn" disabled={index === menuLinks.length - 1} onClick={() => onReorder(link.id, 'down')}>↓</button>
              <button className="tiny-btn" onClick={() => onEdit(link)}>编辑</button>
              <button className="tiny-btn del" onClick={() => onDelete(link.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={onSubmit} style={{ border: '1px solid var(--border)', padding: '1rem', borderRadius: '0.5rem' }}>
        <h3>{editing ? '编辑链接' : '新增链接'}</h3>
        <div className="form-group">
          <label>标题</label>
          <input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} />
        </div>
        <div className="form-group">
          <label>网址</label>
          <input value={form.url} onChange={event => setForm({ ...form, url: event.target.value })} required />
        </div>
        <div className="form-group">
          <label>图标</label>
          <IconInput value={form.icon} onChange={icon => setForm({ ...form, icon })} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" className="btn btn-primary">{editing ? '更新' : '添加'}</button>
          {editing && <button type="button" className="btn" onClick={onCancelEdit}>取消编辑</button>}
        </div>
      </form>
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>关闭</button>
      </div>
    </ModalShell>
  )
}
