import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { prisma } from '../lib/prisma'
import { FastifyInstance } from 'fastify'

const getAttendeeBadgeParamsSchema = z.object({
  attendeeId: z.coerce.number().int(),
})

export async function getAttendeeBadge(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/attendees/:attendeeId/badge',
    {
      schema: {
        params: getAttendeeBadgeParamsSchema,
        response: {},
      },
    },
    async (request, reply) => {
      const { attendeeId } = request.params

      const attendee = await prisma.attendee.findUnique({
        select: {
          name: true,
          email: true,
          event: {
            select: {
              title: true,
            },
          },
        },
        where: {
          id: attendeeId,
        },
      })

      if (attendee === null) {
        throw new Error('Attendee not found.')
      }

      return reply.send({
        attendee,
      })
    },
  )
}
