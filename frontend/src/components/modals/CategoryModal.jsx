import { buildCategoryTree, collectDescendantIds, flattenCategoryTree } from '@mynav/shared/category'
import { IconInput } from '../IconInput'
import { ModalShell } from './ModalShell'

export function CategoryModal({ category, categories, form, setForm, onSubmit, onClose, onClearLinks }) {
  const tree = buildCategoryTree(categories)
  const blocked = category ? collectDescendantIds(findTreeNode(tree, category.id) || { children: [] }) : new Set()
  if (category) blocked.add(category.id)

  const options = flattenCategoryTree(categories).filter(item => !blocked.has(item.id))

  return (
    <ModalShell as="form" onSubmit={onSubmit}>
      <h2>{category ? '编辑分类' : '添加分类'}</h2>
      <div className="form-group">
        <label>分类名称</label>
        <input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} autoFocus required />
      </div>
      <div className="form-group">
        <label>图标</label>
        <IconInput value={form.icon} onChange={icon => setForm({ ...form, icon })} />
      </div>
      <div className="form-group">
        <label>父级分类</label>
        <select className="select-input" value={form.parent_id || ''} onChange={event => setForm({ ...form, parent_id: event.target.value ? Number(event.target.value) : null })}>
          <option value="">无</option>
          {options.map(option => (
            <option key={option.id} value={option.id}>{'--'.repeat(option.depth)} {option.name}</option>
          ))}
        </select>
      </div>
      {category && (
        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px dashed var(--border)' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444', marginBottom: '0.5rem', display: 'block' }}>危险区域</label>
          <button type="button" className="btn" style={{ color: '#ef4444', borderColor: '#ef4444', width: '100%' }} onClick={onClearLinks}>
            清空该分类链接
          </button>
        </div>
      )}
      <div className="modal-actions">
        <button type="button" className="btn" onClick={onClose}>取消</button>
        <button type="submit" className="btn btn-primary">保存</button>
      </div>
    </ModalShell>
  )
}

function findTreeNode(items, id) {
  for (const item of items) {
    if (item.id === id) return item
    const child = findTreeNode(item.children, id)
    if (child) return child
  }
  return null
}
