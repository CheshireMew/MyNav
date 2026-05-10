import { useEffect, useRef, useState } from 'react'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { normalizeIcon } from '@mynav/shared/icon'

export function LinkCard({ link, token, onEdit, onDelete, onDragStart, onDrop }) {
  const cardRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [imgError, setImgError] = useState(false)
  const icon = normalizeIcon(link.icon)

  useEffect(() => setImgError(false), [link.icon])

  useEffect(() => {
    const element = cardRef.current
    if (!element || !token) return undefined

    return combine(
      draggable({
        element,
        getInitialData: () => ({ linkId: link.id }),
        onDragStart: () => {
          setIsDragging(true)
          onDragStart(link)
        },
        onDrop: () => setIsDragging(false)
      }),
      dropTargetForElements({
        element,
        getData: () => ({ linkId: link.id }),
        onDragEnter: () => setIsDragOver(true),
        onDragLeave: () => setIsDragOver(false),
        onDrop: () => {
          setIsDragOver(false)
          onDrop(link)
        }
      })
    )
  }, [link, token, onDragStart, onDrop])

  return (
    <a
      ref={cardRef}
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`link-card${isDragging ? ' is-dragging' : ''}${isDragOver ? ' drag-over' : ''}`}
      draggable={Boolean(token)}
      title={link.description}
      onClick={(event) => {
        if (isDragging) event.preventDefault()
      }}
    >
      {icon.type === 'url' && !imgError ? (
        <img src={icon.value} className="card-icon" alt="" onError={() => setImgError(true)} />
      ) : (
        <FallbackIcon link={link} />
      )}
      <div className="card-info">
        <div className="card-title">{link.title}</div>
        <div className="card-desc">{link.description}</div>
      </div>
      {token && (
        <div className="card-admin-actions">
          <button className="tiny-btn" onClick={(event) => onEdit(link, event)}>✎</button>
          <button className="tiny-btn del" onClick={(event) => onDelete(link.id, event)}>✕</button>
        </div>
      )}
    </a>
  )
}

function FallbackIcon({ link }) {
  const initial = getInitialFromUrl(link.url)
  return (
    <div
      className="card-icon"
      style={{
        background: generateGradient(link.url || link.title),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        textShadow: '0 1px 2px rgba(0,0,0,0.2)'
      }}
    >
      {initial}
    </div>
  )
}

function generateGradient(value) {
  let hash = 0
  const source = value || 'link'
  for (let index = 0; index < source.length; index++) {
    hash = source.charCodeAt(index) + ((hash << 5) - hash)
  }
  const hue1 = Math.abs(hash % 360)
  const hue2 = (hue1 + 60) % 360
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 60%), hsl(${hue2}, 70%, 50%))`
}

function getInitialFromUrl(url) {
  try {
    const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '')
    return hostname.split('.')[0].charAt(0).toUpperCase()
  } catch {
    return '#'
  }
}
