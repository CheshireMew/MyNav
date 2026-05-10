import { flattenCategoryTree } from '@mynav/shared/category'
import { IconInput } from '../IconInput'
import { ModalShell } from './ModalShell'

export function LinkModal({
  isEdit,
  targetUrl,
  setTargetUrl,
  previewData,
  setPreviewData,
  categories,
  scraping,
  onScrape,
  onRefresh,
  onSave,
  onClose
}) {
  const flatCategories = flattenCategoryTree(categories)

  return (
    <ModalShell>
      <h2>{isEdit ? '编辑链接' : '添加链接'}</h2>
      {!previewData ? (
        <form onSubmit={onScrape}>
          <div className="form-group">
            <label>网址</label>
            <input type="text" placeholder="github.com" value={targetUrl} onChange={event => setTargetUrl(event.target.value)} required autoFocus />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={scraping}>{scraping ? '抓取中...' : '抓取信息'}</button>
          </div>
        </form>
      ) : (
        <>
          <div className="form-group">
            <label>标题</label>
            <input value={previewData.title} onChange={event => setPreviewData({ ...previewData, title: event.target.value })} />
          </div>
          <div className="form-group">
            <label>描述</label>
            <textarea value={previewData.description || ''} onChange={event => setPreviewData({ ...previewData, description: event.target.value })} />
          </div>
          <div className="form-group">
            <label>图标</label>
            <IconInput value={previewData.icon} onChange={icon => setPreviewData({ ...previewData, icon })} />
          </div>
          <div className="form-group">
            <label>网址</label>
            <input value={previewData.url || ''} onChange={event => setPreviewData({ ...previewData, url: event.target.value })} />
          </div>
          <div className="form-group">
            <label>分类</label>
            <select
              className="select-input"
              value={previewData.category_id || ''}
              onChange={event => setPreviewData({ ...previewData, category_id: Number(event.target.value) })}
            >
              {flatCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {'--'.repeat(category.depth)} {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            {!isEdit && <button type="button" className="btn" onClick={() => setPreviewData(null)}>重新输入</button>}
            <button type="button" className="btn" onClick={onRefresh} disabled={scraping}>刷新元数据</button>
            <button type="button" className="btn" onClick={onClose}>取消</button>
            <button type="button" className="btn btn-primary" onClick={onSave}>保存</button>
          </div>
        </>
      )}
    </ModalShell>
  )
}
