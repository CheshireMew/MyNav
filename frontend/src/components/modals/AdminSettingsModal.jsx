import { ModalShell } from './ModalShell'

export function AdminSettingsModal({ form, setForm, loginPath, onSubmit, onClose }) {
  return (
    <ModalShell as="form" onSubmit={onSubmit}>
      <h2>管理员设置</h2>
      <div className="form-group">
        <label>当前密码</label>
        <input type="password" value={form.oldPassword} onChange={event => setForm({ ...form, oldPassword: event.target.value })} required autoFocus autoComplete="off" />
      </div>
      <div className="form-group">
        <label>新用户名</label>
        <input value={form.username} onChange={event => setForm({ ...form, username: event.target.value })} autoComplete="off" />
      </div>
      <div className="form-group">
        <label>新密码</label>
        <input type="password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} autoComplete="new-password" />
      </div>
      <div className="form-group">
        <label>登录入口地址 (目前: #{loginPath || 'loading...'})</label>
        <input value={form.login_path} onChange={event => setForm({ ...form, login_path: event.target.value })} autoComplete="off" />
      </div>
      <div className="modal-actions">
        <button type="button" className="btn" onClick={onClose}>取消</button>
        <button type="submit" className="btn btn-primary">保存</button>
      </div>
    </ModalShell>
  )
}
