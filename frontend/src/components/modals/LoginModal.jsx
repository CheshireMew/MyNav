import { ModalShell } from './ModalShell'

export function LoginModal({ form, onChange, onSubmit }) {
  return (
    <ModalShell as="form" onSubmit={onSubmit}>
      <h2>登录</h2>
      <div className="form-group">
        <label>用户名</label>
        <input value={form.username} onChange={event => onChange({ ...form, username: event.target.value })} autoFocus />
      </div>
      <div className="form-group">
        <label>密码</label>
        <input type="password" value={form.password} onChange={event => onChange({ ...form, password: event.target.value })} />
      </div>
      <div className="modal-actions">
        <button className="btn btn-primary" type="submit">登录</button>
      </div>
    </ModalShell>
  )
}
