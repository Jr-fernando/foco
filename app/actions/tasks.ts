'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan, hasPlan } from '@/lib/plans'

const PRIORITIES = ['alta', 'media', 'baixa'] as const
const CATEGORIES = ['Trabalho', 'Pessoal', 'Rotina', 'Ideias'] as const
type Priority = (typeof PRIORITIES)[number]
type Category = (typeof CATEGORIES)[number]

function readDate(value: FormDataEntryValue | null) {
  const date = String(value ?? '')
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null
}

function isPriority(value: string): value is Priority {
  return (PRIORITIES as readonly string[]).includes(value)
}

function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value)
}

// Toda Server Action revalida o usuário autenticado no servidor —
// nunca confia em um user_id vindo do formulário/client.
async function requireUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('não autenticado')
  return { supabase, user }
}

export async function createTask(formData: FormData) {
  const { supabase, user } = await requireUser()

  const title = String(formData.get('title') ?? '').trim()
  const priorityRaw = String(formData.get('priority') ?? 'media')
  const categoryRaw = String(formData.get('category') ?? '')
  const category = isCategory(categoryRaw) ? categoryRaw : null
  const scheduledFor = readDate(formData.get('scheduledFor'))
  const estimateRaw = Number(formData.get('estimateMinutes'))
  const estimateMinutes = Number.isInteger(estimateRaw) && estimateRaw >= 5 && estimateRaw <= 480 ? estimateRaw : null
  const projectRaw = String(formData.get('projectId') ?? '')
  const kind = String(formData.get('kind') ?? '') === 'idea' ? 'idea' : 'task'
  let projectId: string | null = null

  if (!title) return { error: 'A tarefa precisa de um título.' }
  if (title.length > 280) return { error: 'Título muito longo (máx. 280 caracteres).' }
  const priority = isPriority(priorityRaw) ? priorityRaw : 'media'

  if (projectRaw) {
    const plan = await getUserPlan(supabase, user.id)
    if (!hasPlan(plan, 'pro')) return { error: 'Projetos fazem parte do plano Pro.' }
    const { data: project } = await supabase.from('projects').select('id').eq('id', projectRaw).eq('user_id', user.id).maybeSingle()
    if (!project) return { error: 'Escolha um projeto válido.' }
    projectId = project.id
  }

  const { data, error } = await supabase.from('tasks').insert({
    user_id: user.id,
    title,
    priority,
    category,
    scheduled_for: scheduledFor,
    estimate_minutes: estimateMinutes,
    project_id: projectId,
    kind,
  }).select('*').single()

  if (error) return { error: 'Não foi possível criar a tarefa. Tente de novo.' }

  revalidatePath('/painel')
  return { error: null, task: data }
}

export async function toggleTask(taskId: string, done: boolean) {
  const { supabase, user } = await requireUser()

  const { error } = await supabase
    .from('tasks')
    .update({ done, done_at: done ? new Date().toISOString() : null })
    .eq('id', taskId)
    .eq('user_id', user.id) // redundante ao RLS, mas explícito e barato

  if (error) return { error: 'Não foi possível atualizar a tarefa.' }

  if (done) {
    // Streak só incrementa via função SECURITY DEFINER no banco —
    // o client não tem permissão de escrita direta na tabela streaks.
    await supabase.rpc('register_activity', { p_user_id: user.id })
  }

  revalidatePath('/painel')
  return { error: null }
}

export async function deleteTask(taskId: string) {
  const { supabase, user } = await requireUser()

  const { data: attachments } = await supabase.from('task_attachments').select('storage_path').eq('task_id', taskId).eq('user_id', user.id)

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', user.id)

  if (error) return { error: 'Não foi possível excluir a tarefa.' }

  const paths = (attachments ?? []).map((attachment) => attachment.storage_path)
  if (paths.length) await supabase.storage.from('task-attachments').remove(paths)

  revalidatePath('/painel')
  return { error: null }
}

export async function scheduleTask(taskId: string, scheduledFor: string | null) {
  const { supabase, user } = await requireUser()
  if (scheduledFor && !/^\d{4}-\d{2}-\d{2}$/.test(scheduledFor)) {
    return { error: 'A data escolhida não é válida.' }
  }

  const { data, error } = await supabase
    .from('tasks')
    .update({ scheduled_for: scheduledFor })
    .eq('id', taskId)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle()

  if (error || !data) return { error: 'Não foi possível salvar esta tarefa no calendário.' }

  revalidatePath('/painel')
  revalidatePath('/planejar')
  return { error: null }
}
