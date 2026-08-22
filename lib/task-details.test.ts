import { describe, expect, it } from 'vitest'
import { MAX_ATTACHMENT_BYTES, formatFileSize, safeFileName, validateAttachment } from './task-details'

describe('task details helpers', () => {
  it('sanitizes attachment names without losing the extension', () => {
    expect(safeFileName('Reunião final 01.PDF')).toBe('Reuniao-final-01.pdf')
  })

  it('rejects unsupported and oversized files', () => {
    expect(validateAttachment({ size: 100, type: 'application/zip' })).toMatch(/imagem/)
    expect(validateAttachment({ size: MAX_ATTACHMENT_BYTES + 1, type: 'image/png' })).toMatch(/10 MB/)
  })

  it('formats file sizes for the interface', () => {
    expect(formatFileSize(1536)).toBe('2 KB')
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2.0 MB')
  })
})
