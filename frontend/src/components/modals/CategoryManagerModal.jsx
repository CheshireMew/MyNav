import { buildCategoryTree } from '@mynav/shared/category'
import { IconView } from '../IconView'
import { ModalShell } from './ModalShell'

export function CategoryManagerModal({ categories, onClose, onEdit, onDelete, onReorder }) {
  const tree = buildCategoryTree(categories)
  return (
    <ModalShell style={{ maxWidth: '640px' }}>
      <h2>分类管理</h2>
      <div className="manager-list" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {tree.map(category => (
          <CategoryManagerItem
            key={category.id}
            category={category}
            siblings={tree}
            depth={0}
            onEdit={onEdit}
            onDelete={onDelete}
            onReorder={onReorder}
          />
        ))}
      </div>
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>关闭</button>
      </div>
    </ModalShell>
  )
}

function CategoryManagerItem({ category, siblings, depth, onEdit, onDelete, onReorder }) {
  const index = siblings.findIndex(item => item.id === category.id)
  return (
    <>
      <div className="manager-item" style={{ display: 'flex', alignItems: 'center', padding: '0.8rem', paddingLeft: `${0.8 + depth * 1.4}rem`, borderBottom: '1px solid var(--border)', gap: '0.5rem' }}>
        <span style={{ flex: 1, fontWeight: depth ? 500 : 700 }}>
          <IconView icon={category.icon} /> {category.name}
        </span>
        <button className="tiny-btn" disabled={index === 0} onClick={() => onReorder(category.id, 'up')}>↑</button>
        <button className="tiny-btn" disabled={index === siblings.length - 1} onClick={() => onReorder(category.id, 'down')}>↓</button>
        <button className="tiny-btn" onClick={() => onEdit(category)}>编辑</button>
        {category.id !== 1 && <button className="tiny-btn del" onClick={() => onDelete(category.id)}>✕</button>}
      </div>
      {category.children.map(child => (
        <CategoryManagerItem
          key={child.id}
          category={child}
          siblings={category.children}
          depth={depth + 1}
          onEdit={onEdit}
          onDelete={onDelete}
          onReorder={onReorder}
        />
      ))}
    </>
  )
}
