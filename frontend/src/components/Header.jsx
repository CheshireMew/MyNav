import { IconView } from './IconView'

export function Header({ search, onSearch, menuLinks, theme, onToggleTheme }) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="search-bar">
          <input
            type="text"
            placeholder="搜索链接..."
            value={search}
            onChange={event => onSearch(event.target.value)}
          />
        </div>
      </div>
      <div className="header-right">
        <div className="top-nav-menu">
          {menuLinks.map(link => (
            <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="menu-item">
              <IconView icon={link.icon} imageStyle={{ width: '20px', height: '20px', objectFit: 'contain' }} />
              {link.title}
            </a>
          ))}
        </div>
        <div className="top-actions">
          <button className="icon-btn theme-toggle" onClick={onToggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </header>
  )
}
