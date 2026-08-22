export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024

export const ALLOWED_ATTACHMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
] as const

export function validateAttachment(file: Pick<File, 'size' | 'type'>) {
  if (!file.size) return 'O arquivo está vazio.'
  if (file.size > MAX_ATTACHMENT_BYTES) return 'O arquivo deve ter no máximo 10 MB.'
  if (!(ALLOWED_ATTACHMENT_TYPES as readonly string[]).includes(file.type)) {
    return 'Envie uma imagem, PDF ou arquivo de texto.'
  }
  return null
}

export function safeFileName(name: string) {
  const extension = name.includes('.') ? `.${name.split('.').pop()?.toLowerCase()}` : ''
  const base = name.replace(/\.[^.]+$/, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'arquivo'
  return `${base}${extension}`
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
