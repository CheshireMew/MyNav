export function ModalShell({ children, as = 'div', className = 'modal', ...props }) {
  const Shell = as

  return (
    <div className="modal-overlay">
      <Shell className={className} {...props}>
        {children}
      </Shell>
    </div>
  )
}
