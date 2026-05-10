import { iconFromText, iconToText } from '@mynav/shared/icon'


export function IconInput({ value, onChange }) {
  return (
    <input value={iconToText(value)} onChange={event => onChange(iconFromText(event.target.value))} />
  )
}
