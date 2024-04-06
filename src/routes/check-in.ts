import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { prisma } from '../lib/prisma'
import { FastifyInstance } from 'fastify'
import { BadRequest } from './_errors/bad-request'

const checkInParamsSchema = z.object({
  attendeeId: z.coerce.number().int(),
})

export async function checkIn(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/attendees/:attendeeId/check-in',
    {
      schema: {
        summary: 'Check-in an attendee',
        tags: ['check-ins'],
        params: checkInParamsSchema,
        response: {
          201: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { attendeeId } = request.params

      const attendeeCheckIb = await prisma.checkIn.findUnique({
        where: {
          attendeeId,
        },
      })

      if (attendeeCheckIb !== null) {
        throw new BadRequest('Attendee already checked in!')
      }

      await prisma.checkIn.create({
        data: {
          attendeeId,
        },
      })

      return reply.status(201).send()
    },
  )
}
