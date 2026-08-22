'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { formatFileSize, safeFileName, validateAttachment } from '@/lib/task-details'
import {
  createSubtask, deleteSubtask, deleteTaskAttachment, getTaskDetails,
  registerTaskAttachment, toggleSubtask, updateTaskDetails,
} from '@/app/actions/task-details'

type TaskSummary = { id: string; title: string; kind?: 'task' | 'idea' }
type Subtask = { id: string; title: string; done: boolean; position: number }
type Attachment = { id: string; file_name: string; mime_type: string; size_bytes: number; storage_path: string; signed_url: string | null }

export function TaskDetailSheet({ task, userId, onClose }: { task: TaskSummary | null; userId: string; onClose: () => void }) {
  const [notes, setNotes] = useState('')
  const [kind, setKind] = useState<'task' | 'idea'>('task')
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [subtaskTitle, setSubtaskTitle] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!task) return
    let active = true
    getTaskDetails(task.id).then((result) => {
      if (!active) return
      setLoading(false)
      if (result.error || !result.task) { setMessage(result.error ?? 'Não foi possível abrir a tarefa.'); return }
      setNotes(result.task.notes ?? '')
      setKind(result.task.kind === 'idea' ? 'idea' : 'task')
      setSubtasks((result.subtasks ?? []) as Subtask[])
      setAttachments((result.attachments ?? []) as Attachment[])
    })
    return () => { active = false }
  }, [task])

  useEffect(() => {
    if (!task) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => { window.removeEventListener('keydown', closeOnEscape); document.body.style.overflow = previousOverflow }
  }, [task, onClose])

  if (!task) return null
  const completed = subtasks.filter((item) => item.done).length

  async function saveDetails() {
    if (!task) return
    setSaving(true); setMessage('')
    const result = await updateTaskDetails(task.id, notes, kind)
    setSaving(false)
    setMessage(result.error ?? 'Detalhes salvos.')
  }

  async function addSubtask(event: React.FormEvent) {
    event.preventDefault()
    if (!task || !subtaskTitle.trim()) return
    const result = await createSubtask(task.id, subtaskTitle)
    if (result.error) { setMessage(result.error); return }
    setSubtasks((current) => [...current, result.subtask as Subtask]); setSubtaskTitle('')
  }

  async function changeSubtask(item: Subtask) {
    setSubtasks((current) => current.map((row) => row.id === item.id ? { ...row, done: !row.done } : row))
    const result = await toggleSubtask(item.id, !item.done)
    if (result.error) { setSubtasks((current) => current.map((row) => row.id === item.id ? item : row)); setMessage(result.error) }
  }

  async function removeSubtask(id: string) {
    const previous = subtasks
    setSubtasks((current) => current.filter((item) => item.id !== id))
    const result = await deleteSubtask(id)
    if (result.error) { setSubtasks(previous); setMessage(result.error) }
  }

  async function uploadFile(file: File) {
    if (!task) return
    const validation = validateAttachment(file)
    if (validation) { setMessage(validation); return }
    setSaving(true); setMessage('Enviando arquivo com segurança...')
    const path = `${userId}/${task.id}/${crypto.randomUUID()}-${safeFileName(file.name)}`
    const supabase = createClient()
    const { error } = await supabase.storage.from('task-attachments').upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type })
    if (error) { setSaving(false); setMessage('Não foi possível enviar o arquivo.'); return }
    const result = await registerTaskAttachment(task.id, path, file.name, file.type, file.size)
    setSaving(false)
    if (result.error || !result.attachment) { setMessage(result.error ?? 'Não foi possível anexar o arquivo.'); return }
    setAttachments((current) => [result.attachment as Attachment, ...current]); setMessage('Arquivo anexado.')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function removeAttachment(id: string) {
    const previous = attachments
    setAttachments((current) => current.filter((item) => item.id !== id))
    const result = await deleteTaskAttachment(id)
    if (result.error) { setAttachments(previous); setMessage(result.error) }
  }

  return <div className="task-sheet-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <aside className="task-sheet" role="dialog" aria-modal="true" aria-labelledby="task-sheet-title">
      <header><div><span>{kind === 'idea' ? 'Ideia capturada' : 'Detalhes da tarefa'}</span><h2 id="task-sheet-title">{task.title}</h2></div><button type="button" onClick={onClose} aria-label="Fechar detalhes">×</button></header>
      {loading ? <div className="detail-loading"><i /><i /><i /></div> : <div className="task-sheet-content">
        <section className="detail-kind" aria-label="Tipo do registro"><button type="button" className={kind === 'task' ? 'active' : ''} onClick={() => setKind('task')}>✓ Tarefa</button><button type="button" className={kind === 'idea' ? 'active' : ''} onClick={() => setKind('idea')}>✦ Ideia</button></section>
        <section className="detail-section"><div className="detail-heading"><div><span>Checklist</span><strong>{completed}/{subtasks.length} concluídos</strong></div>{subtasks.length > 0 && <small>{Math.round((completed / subtasks.length) * 100)}%</small>}</div>
          <div className="subtask-list">{subtasks.map((item) => <div className={item.done ? 'done' : ''} key={item.id}><button type="button" className="check-button" onClick={() => changeSubtask(item)} aria-label={item.done ? 'Reabrir subtópico' : 'Concluir subtópico'}>{item.done ? '✓' : ''}</button><span>{item.title}</span><button type="button" className="detail-remove" onClick={() => removeSubtask(item.id)} aria-label="Remover subtópico">×</button></div>)}</div>
          <form className="subtask-form" onSubmit={addSubtask}><input value={subtaskTitle} onChange={(event) => setSubtaskTitle(event.target.value)} maxLength={280} placeholder="Adicionar um passo menor..." aria-label="Novo subtópico" /><button type="submit" disabled={!subtaskTitle.trim()}>Adicionar</button></form>
        </section>
        <section className="detail-section"><label className="detail-heading" htmlFor="task-notes"><div><span>Notas</span><strong>Contexto que ajuda você a começar</strong></div><small>{notes.length}/5000</small></label><textarea id="task-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={5000} placeholder="Links, decisões, rascunhos, o que não pode ser esquecido..." /></section>
        <section className="detail-section"><div className="detail-heading"><div><span>Anexos privados</span><strong>Imagens, PDF ou texto</strong></div><small>até 10 MB</small></div>
          <div className="attachment-list">{attachments.map((file) => <article key={file.id}>{file.mime_type.startsWith('image/') && file.signed_url ? <Image src={file.signed_url} alt="" width={44} height={44} unoptimized /> : <i aria-hidden="true">{file.mime_type === 'application/pdf' ? 'PDF' : 'TXT'}</i>}<div><a href={file.signed_url ?? '#'} target="_blank" rel="noreferrer">{file.file_name}</a><span>{formatFileSize(file.size_bytes)}</span></div><button type="button" onClick={() => removeAttachment(file.id)} aria-label={`Remover ${file.file_name}`}>×</button></article>)}</div>
          <label className="attachment-drop"><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf,text/plain" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadFile(file) }} disabled={saving} /><span>＋</span><div><strong>Anexar arquivo</strong><small>Toque para escolher no dispositivo</small></div></label>
        </section>
        {message && <p className="detail-message" role="status">{message}</p>}
      </div>}
      <footer><button type="button" className="button button-soft" onClick={onClose}>Fechar</button><button type="button" className="button button-primary" onClick={saveDetails} disabled={saving || loading}>{saving ? 'Salvando...' : 'Salvar detalhes'}</button></footer>
    </aside>
  </div>
}
