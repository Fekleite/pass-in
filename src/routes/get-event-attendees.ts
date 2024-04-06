import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { prisma } from '../lib/prisma'
import { FastifyInstance } from 'fastify'

const getEventAttendeesParamsSchema = z.object({
  eventId: z.string().uuid(),
})

const getEventAttendeesQuerySchema = z.object({
  pageIndex: z.string().nullable().default('0').transform(Number),
  query: z.string().nullish(),
})

const getEventAttendeesResponseSchema = z.object({
  attendees: z.array(
    z.object({
      id: z.number().int(),
      name: z.string(),
      email: z.string().email(),
      createdAt: z.date(),
      checkedInAt: z.date().nullable(),
    }),
  ),
})

export async function getEventAttendees(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/events/:eventId/attendees',
    {
      schema: {
        summary: 'Get event attendees',
        tags: ['events'],
        params: getEventAttendeesParamsSchema,
        querystring: getEventAttendeesQuerySchema,
        response: {
          200: getEventAttendeesResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { eventId } = request.params
      const { pageIndex, query } = request.query

      const attendees = await prisma.attendee.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          checkIn: {
            select: {
              createdAt: true,
            },
          },
        },
        where: query
          ? {
              eventId,
              name: {
                contains: query,
              },
            }
          : {
              eventId,
            },
        take: 10,
        skip: pageIndex * 10,
        orderBy: {
          createdAt: 'desc',
        },
      })

      return reply.send({
        attendees: attendees.map((attendee) => {
          return {
            id: attendee.id,
            name: attendee.name,
            email: attendee.email,
            createdAt: attendee.createdAt,
            checkedInAt: attendee.checkIn?.createdAt ?? null,
          }
        }),
      })
    },
  )
}
