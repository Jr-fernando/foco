'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan, hasPlan, type ProductPlan } from '@/lib/plans'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function requirePlan(required: ProductPlan) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Entre novamente para continuar.' } as const
  const plan = await getUserPlan(supabase, user.id)
  if (!hasPlan(plan, required)) return { error: `Este recurso faz parte do plano ${required === 'pro' ? 'Pro' : 'Essencial'}.` } as const
  return { supabase, user } as const
}

export async function createRoutine(formData: FormData) {
  const auth = await requirePlan('essential')
  if ('error' in auth) return
  const title = String(formData.get('title') ?? '').trim()
  if (!title || title.length > 120) return
  const { error } = await auth.supabase.from('routines').insert({ user_id: auth.user.id, title })
  if (error) return
  revalidatePath('/rotinas')
}

export async function toggleRoutine(routineId: string, date: string, completed: boolean) {
  const auth = await requirePlan('essential')
  if ('error' in auth) return
  if (!UUID.test(routineId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return
  const query = auth.supabase.from('routine_checkins')
  const { error } = completed
    ? await query.upsert({ routine_id: routineId, user_id: auth.user.id, completed_on: date }, { onConflict: 'routine_id,completed_on' })
    : await query.delete().eq('routine_id', routineId).eq('user_id', auth.user.id).eq('completed_on', date)
  if (error) return
  revalidatePath('/rotinas')
}

export async function deleteRoutine(routineId: string) {
  const auth = await requirePlan('essential')
  if ('error' in auth) return
  if (!UUID.test(routineId)) return
  const { error } = await auth.supabase.from('routines').delete().eq('id', routineId).eq('user_id', auth.user.id)
  if (error) return
  revalidatePath('/rotinas')
}

export async function createProject(formData: FormData) {
  const auth = await requirePlan('pro')
  if ('error' in auth) return
  const name = String(formData.get('name') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  if (!name || name.length > 100 || description.length > 500) return
  const { error } = await auth.supabase.from('projects').insert({ user_id: auth.user.id, name, description: description || null })
  if (error) return
  revalidatePath('/projetos')
}

export async function deleteProject(projectId: string) {
  const auth = await requirePlan('pro')
  if ('error' in auth) return
  if (!UUID.test(projectId)) return
  const { error } = await auth.supabase.from('projects').delete().eq('id', projectId).eq('user_id', auth.user.id)
  if (error) return
  revalidatePath('/projetos')
}
