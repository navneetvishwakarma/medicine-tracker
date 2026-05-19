import { supabase } from '@/lib/supabase'

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars I/O/0/1

function generateCode(): string {
  let code = ''
  const arr = new Uint8Array(6)
  crypto.getRandomValues(arr)
  for (const byte of arr) {
    code += CODE_CHARS[byte % CODE_CHARS.length]
  }
  return code
}

export async function generateInviteCode(ownerUserId: string): Promise<string> {
  const code = generateCode()
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

  const { error } = await supabase
    .from('viewer_invites')
    .insert({ code, owner_user_id: ownerUserId, expires_at: expiresAt })

  if (error) throw error
  return code
}

export async function redeemInviteCode(
  code: string,
  viewerUserId: string,
): Promise<string> {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('viewer_invites')
    .select('code, owner_user_id, used_at')
    .eq('code', code.toUpperCase())
    .gte('expires_at', now)
    .single()

  if (error || !data) throw new Error('Invalid or expired invite code')
  if (data.used_at) throw new Error('Invite code already used')

  // Create family_members link
  const { error: linkErr } = await supabase
    .from('family_members')
    .upsert({ viewer_user_id: viewerUserId, owner_user_id: data.owner_user_id, role: 'viewer' })
  if (linkErr) throw linkErr

  // Mark code as used
  await supabase
    .from('viewer_invites')
    .update({ used_at: now })
    .eq('code', code.toUpperCase())

  return data.owner_user_id
}
