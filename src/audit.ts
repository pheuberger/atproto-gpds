import type { Kysely } from 'kysely'
import type { GroupDatabase } from './db/schema.js'

export async function logAuditEvent(
  groupDb: Kysely<GroupDatabase>,
  actorDid: string,
  action: string,
  result: 'permitted' | 'denied',
  detail?: { collection?: string; rkey?: string; reason?: string; [key: string]: unknown },
  jti?: string,
): Promise<void> {
  await groupDb.insertInto('group_audit_log').values({
    actor_did: actorDid,
    action,
    collection: detail?.collection ?? null,
    rkey: detail?.rkey ?? null,
    result,
    detail: detail ? JSON.stringify(detail) : null,
    jti: jti ?? null,
  }).execute()
}
