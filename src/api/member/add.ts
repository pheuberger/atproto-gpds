import type { Express } from 'express'
import { XRPCError } from '@atproto/xrpc-server'
import { ensureValidDid } from '@atproto/syntax'
import type { AppContext } from '../../context.js'
import { xrpcHandler } from '../util.js'
import { ForbiddenError } from '../../errors.js'
import { ROLE_HIERARCHY, type Role } from '../../rbac/permissions.js'

export default function (app: Express, ctx: AppContext) {
  app.post('/xrpc/app.certified.group.member.add', xrpcHandler(ctx, async (req, res, { callerDid, groupDid }) => {
    const { memberDid, role } = req.body

    // Validate inputs before any async work
    ensureValidDid(memberDid)
    if (!(role in ROLE_HIERARCHY)) {
      throw new XRPCError(400, 'InvalidRole', `Role must be one of: ${Object.keys(ROLE_HIERARCHY).join(', ')}`)
    }

    const groupDb = ctx.groupDbs.get(groupDid)

    // RBAC check and existence check are independent — run in parallel
    const [callerRole, existing] = await Promise.all([
      ctx.rbac.assertCan(groupDb, callerDid, 'member.add'),
      groupDb
        .selectFrom('group_members')
        .select('member_did')
        .where('member_did', '=', memberDid)
        .executeTakeFirst(),
    ])

    if (existing) {
      throw new XRPCError(409, 'MemberAlreadyExists', 'Member already exists')
    }

    // Cannot assign equal or higher role
    if (ROLE_HIERARCHY[callerRole] <= ROLE_HIERARCHY[role as Role]) {
      throw new ForbiddenError('Cannot assign a role equal to or higher than your own')
    }

    const member = await groupDb
      .insertInto('group_members')
      .values({ member_did: memberDid, role, added_by: callerDid })
      .returning(['member_did', 'role', 'added_at'])
      .executeTakeFirstOrThrow()

    await ctx.audit.log(groupDb, callerDid, 'member.add', 'permitted', { memberDid, role })

    res.json({
      memberDid: member.member_did,
      role: member.role,
      addedAt: member.added_at,
    })
  }))
}
