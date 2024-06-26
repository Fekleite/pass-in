import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { prisma } from '../lib/prisma'
import { FastifyInstance } from 'fastify'
import { BadRequest } from './_errors/bad-request'

const getEventParamsSchema = z.object({
  eventId: z.string().uuid(),
})

const getEventResponseSchema = z.object({
  event: z.object({
    title: z.string(),
    details: z.string().nullable(),
    maximumAttendees: z.number().int().positive().nullable(),
    slug: z.string(),
    id: z.string().uuid(),
    attendeesAmount: z.number().int().positive(),
  }),
})

export async function getEvent(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/events/:eventId',
    {
      schema: {
        summary: 'Get an event',
        tags: ['events'],
        params: getEventParamsSchema,
        response: {
          200: getEventResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { eventId } = request.params

      const event = await prisma.event.findUnique({
        select: {
          id: true,
          title: true,
          slug: true,
          details: true,
          maximumAttendees: true,
          _count: {
            select: {
              attendees: true,
            },
          },
        },
        where: {
          id: eventId,
        },
      })

      if (event === null) {
        throw new BadRequest('Event not found.')
      }

      return reply.send({
        event: {
          id: event.id,
          title: event.title,
          slug: event.slug,
          details: event.details,
          maximumAttendees: event.maximumAttendees,
          attendeesAmount: event._count.attendees,
        },
      })
    },
  )
}
