interface FormFieldProps {
  label: string
  name: string
  defaultValue?: string
  required?: boolean
  type?: string
  as?: 'input' | 'textarea' | 'select'
  children?: React.ReactNode
}

export default function FormField({
  label,
  name,
  defaultValue = '',
  required = false,
  type = 'text',
  as = 'input',
  children,
}: FormFieldProps) {
  const style = {
    width: '100%',
    padding: '0.65rem',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '0.9rem',
    boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '0.3rem', color: '#aaa', fontSize: '0.85rem' }}>
        {label}
        {required && <span style={{ color: '#f87171' }}> *</span>}
      </label>
      {as === 'textarea' ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          required={required}
          rows={6}
          style={{ ...style, resize: 'vertical' }}
        />
      ) : as === 'select' ? (
        <select name={name} defaultValue={defaultValue} required={required} style={style}>
          {children}
        </select>
      ) : (
        <input name={name} type={type} defaultValue={defaultValue} required={required} style={style} />
      )}
    </div>
  )
}
