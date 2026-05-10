import { IconView } from './IconView'
import { LinkCard } from './LinkCard'
import { hasLinksInTree } from '@mynav/shared/category'

export function CategorySections({ tree, links, search, token, onEditLink, onDeleteLink, onDragStart, onDrop }) {
  if (search) {
    return (
      <div className="links-grid">
        {links.map(link => (
          <LinkCard
            key={link.id}
            link={link}
            token={token}
            onEdit={onEditLink}
            onDelete={onDeleteLink}
            onDragStart={onDragStart}
            onDrop={onDrop}
          />
        ))}
      </div>
    )
  }

  return tree.map(category => (
    <CategorySection
      key={category.id}
      category={category}
      links={links}
      token={token}
      depth={0}
      onEditLink={onEditLink}
      onDeleteLink={onDeleteLink}
      onDragStart={onDragStart}
      onDrop={onDrop}
    />
  ))
}

function CategorySection({ category, links, token, depth, onEditLink, onDeleteLink, onDragStart, onDrop }) {
  if (!hasLinksInTree(category, links)) return null

  const categoryLinks = links
    .filter(link => link.category_id === category.id)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id)

  return (
    <>
      {categoryLinks.length > 0 && (
        <div id={`cat-${category.id}`} className="category-section" style={{ paddingLeft: `${depth * 1.2}rem` }}>
          <h3 className="category-header" style={{ fontSize: depth ? '1.05rem' : '1.3rem', opacity: depth ? 0.85 : 1 }}>
            <IconView icon={category.icon} /> {category.name}
          </h3>
          <div className="links-grid">
            {categoryLinks.map(link => (
              <LinkCard
                key={link.id}
                link={link}
                token={token}
                onEdit={onEditLink}
                onDelete={onDeleteLink}
                onDragStart={onDragStart}
                onDrop={onDrop}
              />
            ))}
          </div>
        </div>
      )}
      {category.children.map(child => (
        <CategorySection
          key={child.id}
          category={child}
          links={links}
          token={token}
          depth={depth + 1}
          onEditLink={onEditLink}
          onDeleteLink={onDeleteLink}
          onDragStart={onDragStart}
          onDrop={onDrop}
        />
      ))}
    </>
  )
}
