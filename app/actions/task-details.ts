'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ALLOWED_ATTACHMENT_TYPES, MAX_ATTACHMENT_BYTES } from '@/lib/task-details'

async function requireUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('não autenticado')
  return { supabase, user }
}

async function ownsTask(taskId: string) {
  const { supabase, user } = await requireUser()
  const { data } = await supabase.from('tasks').select('id,title,notes,kind').eq('id', taskId).eq('user_id', user.id).maybeSingle()
  return { supabase, user, task: data }
}

export async function getTaskDetails(taskId: string) {
  const { supabase, user, task } = await ownsTask(taskId)
  if (!task) return { error: 'Tarefa não encontrada.' }

  const [{ data: subtasks, error: subtasksError }, { data: attachments, error: attachmentsError }] = await Promise.all([
    supabase.from('task_subtasks').select('id,title,done,position').eq('task_id', taskId).eq('user_id', user.id).order('position').order('created_at'),
    supabase.from('task_attachments').select('id,file_name,mime_type,size_bytes,storage_path').eq('task_id', taskId).eq('user_id', user.id).order('created_at', { ascending: false }),
  ])
  if (subtasksError || attachmentsError) return { error: 'Não foi possível abrir os detalhes desta tarefa.' }

  const files = await Promise.all((attachments ?? []).map(async (attachment) => {
    const { data } = await supabase.storage.from('task-attachments').createSignedUrl(attachment.storage_path, 300)
    return { ...attachment, signed_url: data?.signedUrl ?? null }
  }))
  return { error: null, task, subtasks: subtasks ?? [], attachments: files }
}

export async function updateTaskDetails(taskId: string, notes: string, kind: string) {
  const { supabase, user } = await requireUser()
  const cleanNotes = notes.trim()
  const cleanKind = kind === 'idea' ? 'idea' : 'task'
  if (cleanNotes.length > 5000) return { error: 'As notas devem ter no máximo 5.000 caracteres.' }
  const { data, error } = await supabase.from('tasks').update({ notes: cleanNotes || null, kind: cleanKind })
    .eq('id', taskId).eq('user_id', user.id).select('id').maybeSingle()
  if (error || !data) return { error: 'Não foi possível salvar os detalhes.' }
  revalidatePath('/painel')
  return { error: null }
}

export async function createSubtask(taskId: string, title: string) {
  const { supabase, user, task } = await ownsTask(taskId)
  const cleanTitle = title.trim()
  if (!task) return { error: 'Tarefa não encontrada.' }
  if (!cleanTitle || cleanTitle.length > 280) return { error: 'Escreva um subtópico de até 280 caracteres.' }
  const { data, error } = await supabase.from('task_subtasks').insert({ task_id: taskId, user_id: user.id, title: cleanTitle })
    .select('id,title,done,position').single()
  if (error) return { error: 'Não foi possível adicionar este subtópico.' }
  revalidatePath('/painel')
  return { error: null, subtask: data }
}

export async function toggleSubtask(subtaskId: string, done: boolean) {
  const { supabase, user } = await requireUser()
  const { data, error } = await supabase.from('task_subtasks').update({ done }).eq('id', subtaskId).eq('user_id', user.id).select('id').maybeSingle()
  if (error || !data) return { error: 'Não foi possível atualizar este subtópico.' }
  revalidatePath('/painel')
  return { error: null }
}

export async function deleteSubtask(subtaskId: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('task_subtasks').delete().eq('id', subtaskId).eq('user_id', user.id)
  if (error) return { error: 'Não foi possível remover este subtópico.' }
  revalidatePath('/painel')
  return { error: null }
}

export async function registerTaskAttachment(taskId: string, storagePath: string, fileName: string, mimeType: string, sizeBytes: number) {
  const { supabase, user, task } = await ownsTask(taskId)
  if (!task) return { error: 'Tarefa não encontrada.' }
  if (!storagePath.startsWith(`${user.id}/${taskId}/`)) return { error: 'Caminho de arquivo inválido.' }
  if (!(ALLOWED_ATTACHMENT_TYPES as readonly string[]).includes(mimeType) || sizeBytes < 1 || sizeBytes > MAX_ATTACHMENT_BYTES) {
    return { error: 'Este tipo ou tamanho de arquivo não é permitido.' }
  }
  const cleanName = fileName.trim().slice(0, 240)
  if (!cleanName) return { error: 'Nome de arquivo inválido.' }
  const { data, error } = await supabase.from('task_attachments').insert({
    task_id: taskId, user_id: user.id, storage_path: storagePath, file_name: cleanName, mime_type: mimeType, size_bytes: sizeBytes,
  }).select('id,file_name,mime_type,size_bytes,storage_path').single()
  if (error) {
    await supabase.storage.from('task-attachments').remove([storagePath])
    return { error: 'Não foi possível vincular o arquivo à tarefa.' }
  }
  const { data: signed } = await supabase.storage.from('task-attachments').createSignedUrl(storagePath, 300)
  revalidatePath('/painel')
  return { error: null, attachment: { ...data, signed_url: signed?.signedUrl ?? null } }
}

export async function deleteTaskAttachment(attachmentId: string) {
  const { supabase, user } = await requireUser()
  const { data } = await supabase.from('task_attachments').select('id,storage_path').eq('id', attachmentId).eq('user_id', user.id).maybeSingle()
  if (!data) return { error: 'Arquivo não encontrado.' }
  const { error: storageError } = await supabase.storage.from('task-attachments').remove([data.storage_path])
  if (storageError) return { error: 'Não foi possível remover o arquivo.' }
  const { error } = await supabase.from('task_attachments').delete().eq('id', attachmentId).eq('user_id', user.id)
  if (error) return { error: 'O arquivo foi removido, mas a lista não pôde ser atualizada.' }
  revalidatePath('/painel')
  return { error: null }
}
