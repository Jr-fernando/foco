'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const PRIORITIES = ['alta', 'media', 'baixa'] as const
type Priority = (typeof PRIORITIES)[number]

function isPriority(value: string): value is Priority {
  return (PRIORITIES as readonly string[]).includes(value)
}

// Toda Server Action revalida o usuário autenticado no servidor —
// nunca confia em um user_id vindo do formulário/client.
async function requireUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('não autenticado')
  return { supabase, user }
}

export async function createTask(formData: FormData) {
  const { supabase, user } = await requireUser()

  const title = String(formData.get('title') ?? '').trim()
  const priorityRaw = String(formData.get('priority') ?? 'media')
  const category = formData.get('category') ? String(formData.get('category')) : null

  if (!title) return { error: 'A tarefa precisa de um título.' }
  if (title.length > 280) return { error: 'Título muito longo (máx. 280 caracteres).' }
  const priority = isPriority(priorityRaw) ? priorityRaw : 'media'

  const { error } = await supabase.from('tasks').insert({
    user_id: user.id,
    title,
    priority,
    category,
  })

  if (error) return { error: 'Não foi possível criar a tarefa. Tente de novo.' }

  revalidatePath('/')
  return { error: null }
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

  revalidatePath('/')
  return { error: null }
}

export async function deleteTask(taskId: string) {
  const { supabase, user } = await requireUser()

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', user.id)

  if (error) return { error: 'Não foi possível excluir a tarefa.' }

  revalidatePath('/')
  return { error: null }
}
