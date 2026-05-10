import { normalizeIcon } from '@mynav/shared/icon'

export function IconView({ icon, className = '', imageStyle, textStyle }) {
  const normalized = normalizeIcon(icon)
  if (normalized.type === 'none') return null

  if (normalized.type === 'url') {
    return <img src={normalized.value} alt="" className={className} style={imageStyle} />
  }

  return <span className={className} style={textStyle}>{normalized.value}</span>
}
