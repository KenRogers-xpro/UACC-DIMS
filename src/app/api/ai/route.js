import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'
import {
  unauthorizedResponse,
  serverErrorResponse,
  errorResponse,
} from '@/lib/response'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// ─── SYSTEM PROMPTS PER ROLE ─────────────────────────────────────────────────

const SYSTEM_PROMPTS = {
  GENERAL_MANAGER: (user, date) => `
You are the DIMS Executive Assistant for Uganda Air Cargo Corporation (UACC).
You are speaking with ${user.name}, the General Manager of UACC.

Your role is to give the General Manager complete, accurate operational intelligence
across all five departments. You have access to all DIMS modules:
documents, procurement, activity logs, records registry, users, and audit trail.

Today is ${date}. UACC is a government-owned aviation corporation supervised
by the Ministry of Defence and Veteran Affairs (MODVA), located at
Entebbe International Airport, Uganda.

Your communication style:
- Executive-level: concise, data-driven, action-oriented
- Always highlight items requiring the GM's decision or attention
- Flag anomalies, overdue approvals, or compliance issues proactively
- Format responses with clear sections and bullet points
- Use UGX for all currency amounts with proper formatting
- Never make up data — always query your tools first
  `,

  DEPARTMENT_HEAD: (user, date) => `
You are the DIMS Department Assistant for Uganda Air Cargo Corporation (UACC).
You are speaking with ${user.name}, Department Head of ${user.department?.replace(/_/g, ' ')}.

Your role is to help ${user.name} manage their department efficiently.
You can see procurement requests from their department, their team's activity logs,
documents relevant to their department, and items awaiting their approval.

Today is ${date}.

Your communication style:
- Practical and department-focused
- Highlight pending approvals that need action from ${user.name}
- Summarize team activity and compliance
- Help draft justifications or understand procurement requirements
- Professional but approachable
- Never make up data — always query your tools first
  `,

  STAFF: (user, date) => `
You are the DIMS Personal Assistant for Uganda Air Cargo Corporation (UACC).
You are speaking with ${user.name}, a staff member in the
${user.department?.replace(/_/g, ' ')} department.

Your role is to help ${user.name} with their daily DIMS tasks:
- Checking the status of their procurement requests
- Finding and accessing documents
- Understanding how to submit activity logs correctly
- Getting answers about UACC processes and procedures

Today is ${date}.

Your communication style:
- Friendly, helpful, and encouraging
- Use simple, clear language — avoid technical jargon
- Guide them step by step when they need help with a task
- Remind them about pending tasks (e.g. if they haven't logged today)
- Be supportive and patient
- Never make up data — always query your tools first
  `,

  IT_ADMINISTRATOR: (user, date) => `
You are the DIMS System Assistant for Uganda Air Cargo Corporation (UACC).
You are speaking with ${user.name}, the IT Administrator.

Your role is to help ${user.name} manage the DIMS system:
- User account management and access control
- System activity monitoring via the audit trail
- Technical issue identification and guidance
- Security anomaly detection
- Database health and usage statistics

Today is ${date}.

Your communication style:
- Technical and precise
- Proactively flag security concerns or unusual activity
- Help interpret audit trail data
- Provide clear system health summaries
- Never make up data — always query your tools first
  `,

  AUDITOR: (user, date) => `
You are the DIMS Audit Assistant for Uganda Air Cargo Corporation (UACC).
You are speaking with ${user.name}, the Internal Auditor.

Your role is to help ${user.name} with audit and compliance work:
- Analyzing the system audit trail for anomalies
- Reviewing procurement approval patterns
- Checking document access and deletion logs
- Identifying compliance gaps in activity log submissions
- Generating audit evidence and summaries

Today is ${date}.

UACC has legal record-keeping obligations under its Act of Parliament (Cap. 207).
Flag any activity that may indicate non-compliance.

Your communication style:
- Formal and precise — audit language
- Evidence-based: always cite specific records, references, timestamps
- Highlight risks and compliance gaps clearly
- Structure findings in a way that can be used in audit reports
- Never make up data — always query your tools first
  `,

  RECORDS_EXECUTIVE: (user, date) => `
You are the DIMS Records Assistant for Uganda Air Cargo Corporation (UACC).
You are speaking with ${user.name}, the Records Executive.

Your role is to help ${user.name} manage UACC's universal document registry:
- Tracking the status of registered documents (incoming, outgoing, internal)
- Finding specific registry entries by subject, reference, or source
- Understanding what annotations have been added to documents
- Monitoring overdue or pending documents
- Generating dispatch and receipt summaries

Today is ${date}.

Your communication style:
- Methodical and records-focused
- Always reference documents by their registry number (REG-UACC-YYYY-XXXX)
- Flag documents that are overdue for action or have been pending too long
- Help interpret document movement history
- Never make up data — always query your tools first
  `,
}

// ─── TOOLS PER ROLE ──────────────────────────────────────────────────────────

const TOOLS_BY_ROLE = {
  GENERAL_MANAGER: [
    'get_system_overview',
    'get_procurement_summary',
    'get_document_summary',
    'get_activity_log_summary',
    'get_registry_summary',
    'get_audit_summary',
    'get_pending_decisions',
    'get_department_performance',
  ],
  DEPARTMENT_HEAD: [
    'get_dept_procurement',
    'get_dept_activity_logs',
    'get_dept_documents',
    'get_pending_approvals',
    'get_dept_overview',
  ],
  STAFF: [
    'get_my_procurement_requests',
    'get_my_activity_logs',
    'search_documents',
    'check_todays_log',
    'get_my_overview',
  ],
  IT_ADMINISTRATOR: [
    'get_system_overview',
    'get_user_list',
    'get_audit_summary',
    'get_security_report',
    'get_system_health',
  ],
  AUDITOR: [
    'get_audit_summary',
    'get_audit_anomalies',
    'get_procurement_audit',
    'get_compliance_report',
    'get_document_access_log',
  ],
  RECORDS_EXECUTIVE: [
    'get_registry_summary',
    'get_pending_registry',
    'search_registry',
    'get_registry_analytics',
  ],
}

// ─── ALL TOOL DEFINITIONS ─────────────────────────────────────────────────────

const ALL_TOOLS = {

  get_system_overview: {
    name: 'get_system_overview',
    description: 'Get complete DIMS system overview with all key metrics across all modules',
    input_schema: { type: 'object', properties: {}, required: [] },
  },

  get_procurement_summary: {
    name: 'get_procurement_summary',
    description: 'Get procurement statistics, recent requests, and cost analysis',
    input_schema: {
      type: 'object',
      properties: {
        status:     { type: 'string', description: 'Filter: ALL, PENDING, APPROVED, REJECTED, DEPT_HEAD_APPROVED' },
        department: { type: 'string', description: 'Filter by department name' },
        limit:      { type: 'number', description: 'Number of results (default 5)' },
      },
      required: [],
    },
  },

  get_document_summary: {
    name: 'get_document_summary',
    description: 'Get document repository statistics and recent uploads',
    input_schema: {
      type: 'object',
      properties: {
        category:   { type: 'string', description: 'Filter by category' },
        department: { type: 'string', description: 'Filter by department' },
        limit:      { type: 'number', description: 'Number of results' },
      },
      required: [],
    },
  },

  get_activity_log_summary: {
    name: 'get_activity_log_summary',
    description: 'Get staff activity log statistics and hours by department',
    input_schema: {
      type: 'object',
      properties: {
        department: { type: 'string', description: 'Filter by department' },
        dateFrom:   { type: 'string', description: 'Start date YYYY-MM-DD' },
        dateTo:     { type: 'string', description: 'End date YYYY-MM-DD' },
      },
      required: [],
    },
  },

  get_registry_summary: {
    name: 'get_registry_summary',
    description: 'Get document registry statistics — incoming, outgoing, internal correspondence',
    input_schema: {
      type: 'object',
      properties: {
        direction: { type: 'string', enum: ['INCOMING', 'OUTGOING', 'INTERNAL'] },
        status:    { type: 'string', description: 'Filter by status' },
        limit:     { type: 'number', description: 'Number of results' },
      },
      required: [],
    },
  },

  get_audit_summary: {
    name: 'get_audit_summary',
    description: 'Get audit trail summary with recent actions and statistics',
    input_schema: {
      type: 'object',
      properties: {
        action:  { type: 'string', description: 'Filter by action type' },
        userId:  { type: 'number', description: 'Filter by user ID' },
        days:    { type: 'number', description: 'Last N days (default 7)' },
      },
      required: [],
    },
  },

  get_pending_decisions: {
    name: 'get_pending_decisions',
    description: 'Get all items awaiting GM decision — procurement approvals, registry actions',
    input_schema: { type: 'object', properties: {}, required: [] },
  },

  get_department_performance: {
    name: 'get_department_performance',
    description: 'Get performance metrics for all five UACC departments',
    input_schema: {
      type: 'object',
      properties: {
        department: { type: 'string', description: 'Specific department (optional)' },
      },
      required: [],
    },
  },

  get_dept_procurement: {
    name: 'get_dept_procurement',
    description: 'Get procurement requests for the department head\'s department',
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status' },
        limit:  { type: 'number', description: 'Number of results' },
      },
      required: [],
    },
  },

  get_dept_activity_logs: {
    name: 'get_dept_activity_logs',
    description: 'Get activity logs for the department head\'s department',
    input_schema: {
      type: 'object',
      properties: {
        dateFrom: { type: 'string' },
        dateTo:   { type: 'string' },
      },
      required: [],
    },
  },

  get_dept_documents: {
    name: 'get_dept_documents',
    description: 'Get documents belonging to the department head\'s department',
    input_schema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Filter by category' },
        limit:    { type: 'number' },
      },
      required: [],
    },
  },

  get_pending_approvals: {
    name: 'get_pending_approvals',
    description: 'Get procurement requests awaiting this department head\'s approval',
    input_schema: { type: 'object', properties: {}, required: [] },
  },

  get_dept_overview: {
    name: 'get_dept_overview',
    description: 'Get a complete overview of the department head\'s department',
    input_schema: { type: 'object', properties: {}, required: [] },
  },

  get_my_procurement_requests: {
    name: 'get_my_procurement_requests',
    description: 'Get the current staff member\'s own procurement requests and their status',
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status' },
      },
      required: [],
    },
  },

  get_my_activity_logs: {
    name: 'get_my_activity_logs',
    description: 'Get the current staff member\'s own activity log history',
    input_schema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of recent logs to return' },
      },
      required: [],
    },
  },

  search_documents: {
    name: 'search_documents',
    description: 'Search the document repository by keyword or category',
    input_schema: {
      type: 'object',
      properties: {
        query:    { type: 'string', description: 'Search keyword' },
        category: { type: 'string', description: 'Document category' },
      },
      required: ['query'],
    },
  },

  check_todays_log: {
    name: 'check_todays_log',
    description: 'Check if the current staff member has submitted their activity log today',
    input_schema: { type: 'object', properties: {}, required: [] },
  },

  get_my_overview: {
    name: 'get_my_overview',
    description: 'Get a personal overview for the staff member — requests, logs, documents',
    input_schema: { type: 'object', properties: {}, required: [] },
  },

  get_user_list: {
    name: 'get_user_list',
    description: 'Get list of all DIMS users with their roles and active status',
    input_schema: {
      type: 'object',
      properties: {
        role:     { type: 'string', description: 'Filter by role' },
        isActive: { type: 'boolean', description: 'Filter by active status' },
      },
      required: [],
    },
  },

  get_security_report: {
    name: 'get_security_report',
    description: 'Get security report — failed logins, delete actions, unusual activity',
    input_schema: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'Last N days (default 7)' },
      },
      required: [],
    },
  },

  get_system_health: {
    name: 'get_system_health',
    description: 'Get system health metrics — database record counts, growth rates',
    input_schema: { type: 'object', properties: {}, required: [] },
  },

  get_audit_anomalies: {
    name: 'get_audit_anomalies',
    description: 'Detect anomalies in the audit trail — unusual patterns, after-hours access, bulk deletions',
    input_schema: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'Last N days to analyze (default 30)' },
      },
      required: [],
    },
  },

  get_procurement_audit: {
    name: 'get_procurement_audit',
    description: 'Audit procurement requests — approval patterns, cost anomalies, rejected requests',
    input_schema: {
      type: 'object',
      properties: {
        department: { type: 'string', description: 'Filter by department' },
      },
      required: [],
    },
  },

  get_compliance_report: {
    name: 'get_compliance_report',
    description: 'Get activity log compliance report — who has not submitted logs, compliance rates by department',
    input_schema: {
      type: 'object',
      properties: {
        dateFrom: { type: 'string' },
        dateTo:   { type: 'string' },
      },
      required: [],
    },
  },

  get_document_access_log: {
    name: 'get_document_access_log',
    description: 'Get document access audit — uploads, downloads, deletions with user details',
    input_schema: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'Last N days' },
      },
      required: [],
    },
  },

  get_pending_registry: {
    name: 'get_pending_registry',
    description: 'Get all registry entries that are pending action or overdue',
    input_schema: { type: 'object', properties: {}, required: [] },
  },

  search_registry: {
    name: 'search_registry',
    description: 'Search the document registry by subject, reference number, or source',
    input_schema: {
      type: 'object',
      properties: {
        query:     { type: 'string', description: 'Search term' },
        direction: { type: 'string', description: 'INCOMING, OUTGOING, or INTERNAL' },
      },
      required: ['query'],
    },
  },

  get_registry_analytics: {
    name: 'get_registry_analytics',
    description: 'Get registry analytics — volume by direction, type, status, and time period',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
}

// ─── TOOL EXECUTOR ────────────────────────────────────────────────────────────

async function executeTool(toolName, toolInput, session) {
  const userId     = parseInt(session.user.id)
  const userRole   = session.user.role
  const userDept   = session.user.department

  try {
    switch (toolName) {

      case 'get_system_overview': {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const [
          totalDocs, totalProc, pendingProc,
          totalLogs, logsToday, totalUsers,
          activeUsers, totalRegistry,
        ] = await Promise.all([
          prisma.document.count(),
          prisma.procurementRequest.count(),
          prisma.procurementRequest.count({
            where: { status: { in: ['PENDING', 'DEPT_HEAD_APPROVED'] } }
          }),
          prisma.activityLog.count(),
          prisma.activityLog.count({ where: { createdAt: { gte: today } } }),
          prisma.user.count(),
          prisma.user.count({ where: { isActive: true } }),
          prisma.registryEntry.count(),
        ])
        return {
          documents:    { total: totalDocs },
          procurement:  { total: totalProc, pending: pendingProc },
          activityLogs: { total: totalLogs, today: logsToday },
          users:        { total: totalUsers, active: activeUsers },
          registry:     { total: totalRegistry },
          asOf:         new Date().toISOString(),
        }
      }

      case 'get_pending_decisions': {
        const [pendingProc, pendingRegistry] = await Promise.all([
          prisma.procurementRequest.findMany({
            where:   { status: { in: ['PENDING', 'DEPT_HEAD_APPROVED'] } },
            include: { requestedBy: { select: { name: true, department: true } } },
            orderBy: { createdAt: 'asc' },
          }),
          prisma.registryEntry.findMany({
            where:   { status: { in: ['PENDING', 'DISPATCHED'] } },
            orderBy: { dateRegistered: 'asc' },
          }),
        ])
        return {
          procurementAwaitingGM: pendingProc.filter(r =>
            r.status === 'DEPT_HEAD_APPROVED'
          ).map(r => ({
            ref:         r.referenceNo,
            item:        r.itemDescription,
            cost:        r.estimatedCost,
            dept:        r.department,
            requestedBy: r.requestedBy.name,
            submittedAt: r.createdAt,
          })),
          procurementAwaitingDeptHead: pendingProc.filter(r =>
            r.status === 'PENDING'
          ).map(r => ({
            ref:         r.referenceNo,
            item:        r.itemDescription,
            cost:        r.estimatedCost,
            dept:        r.department,
            requestedBy: r.requestedBy.name,
            submittedAt: r.createdAt,
          })),
          registryPending: pendingRegistry.map(e => ({
            ref:       e.registryNo,
            subject:   e.subject,
            direction: e.direction,
            priority:  e.priority,
            since:     e.dateRegistered,
          })),
        }
      }

      case 'get_department_performance': {
        const departments = [
          'GENERAL_MANAGER_OFFICE',
          'FINANCE_AND_ADMINISTRATION',
          'ENGINEERING',
          'PILOTS',
          'OPERATIONS',
        ]
        const targetDepts = toolInput.department
          ? [toolInput.department]
          : departments

        const performance = await Promise.all(
          targetDepts.map(async (dept) => {
            const [procCount, logCount, docCount, totalHours] = await Promise.all([
              prisma.procurementRequest.count({ where: { department: dept } }),
              prisma.activityLog.count({ where: { department: dept } }),
              prisma.document.count({ where: { department: dept } }),
              prisma.activityLog.aggregate({
                where: { department: dept },
                _sum:  { hoursSpent: true },
                _avg:  { hoursSpent: true },
              }),
            ])
            return {
              department:   dept.replace(/_/g, ' '),
              procurement:  procCount,
              activityLogs: logCount,
              documents:    docCount,
              totalHours:   totalHours._sum.hoursSpent || 0,
              avgHours:     totalHours._avg.hoursSpent || 0,
            }
          })
        )
        return { departments: performance }
      }

      case 'get_procurement_summary': {
        const where = {}
        if (toolInput.status && toolInput.status !== 'ALL') {
          where.status = toolInput.status
        }
        if (toolInput.department) {
          where.department = { contains: toolInput.department }
        }
        const [requests, total, byStatus, byDept, totalCost] = await Promise.all([
          prisma.procurementRequest.findMany({
            where,
            take:    toolInput.limit || 5,
            orderBy: { createdAt: 'desc' },
            include: { requestedBy: { select: { name: true } } },
          }),
          prisma.procurementRequest.count({ where }),
          prisma.procurementRequest.groupBy({
            by: ['status'], _count: { status: true },
          }),
          prisma.procurementRequest.groupBy({
            by: ['department'], _count: { department: true },
            orderBy: { _count: { department: 'desc' } },
          }),
          prisma.procurementRequest.aggregate({
            where, _sum: { estimatedCost: true },
          }),
        ])
        return {
          total,
          totalCost:    totalCost._sum.estimatedCost,
          byStatus,
          byDepartment: byDept,
          recent:       requests.map(r => ({
            ref:  r.referenceNo, item: r.itemDescription,
            cost: r.estimatedCost, status: r.status,
            dept: r.department,   by:   r.requestedBy.name,
            date: r.createdAt,
          })),
        }
      }

      case 'get_document_summary': {
        const where = {}
        if (toolInput.category)   where.category   = toolInput.category
        if (toolInput.department) where.department = toolInput.department
        const [docs, total, byCategory, byDept] = await Promise.all([
          prisma.document.findMany({
            where, take: toolInput.limit || 5,
            orderBy: { createdAt: 'desc' },
            include: { uploader: { select: { name: true } } },
          }),
          prisma.document.count({ where }),
          prisma.document.groupBy({ by: ['category'], _count: { category: true } }),
          prisma.document.groupBy({
            by: ['department'], _count: { department: true },
            orderBy: { _count: { department: 'desc' } },
          }),
        ])
        return {
          total, byCategory, byDepartment: byDept,
          recent: docs.map(d => ({
            title: d.title, category: d.category,
            dept:  d.department, by: d.uploader.name,
            date:  d.createdAt,
          })),
        }
      }

      case 'get_activity_log_summary': {
        const where = {}
        if (toolInput.department) where.department = toolInput.department
        if (toolInput.dateFrom)   where.logDate    = { gte: new Date(toolInput.dateFrom) }
        if (toolInput.dateTo)     where.logDate    = { ...where.logDate, lte: new Date(toolInput.dateTo) }
        const [logs, total, byDept, agg] = await Promise.all([
          prisma.activityLog.findMany({
            where, take: 5, orderBy: { logDate: 'desc' },
            include: { user: { select: { name: true } } },
          }),
          prisma.activityLog.count({ where }),
          prisma.activityLog.groupBy({
            by: ['department'],
            _count: { department: true },
            _sum:   { hoursSpent: true },
          }),
          prisma.activityLog.aggregate({
            where, _sum: { hoursSpent: true }, _avg: { hoursSpent: true },
          }),
        ])
        return {
          total, totalHours: agg._sum.hoursSpent,
          avgHours: agg._avg.hoursSpent, byDepartment: byDept,
          recent: logs.map(l => ({
            staff: l.user.name, dept: l.department,
            date:  l.logDate,  hours: l.hoursSpent,
            desc:  l.activityDescription.substring(0, 80) + '...',
          })),
        }
      }

      case 'get_registry_summary': {
        const where = {}
        if (toolInput.direction) where.direction = toolInput.direction
        if (toolInput.status)    where.status    = toolInput.status
        const [entries, total, byDir, byStatus] = await Promise.all([
          prisma.registryEntry.findMany({
            where, take: toolInput.limit || 5,
            orderBy: { dateRegistered: 'desc' },
            include: { handledBy: { select: { name: true } } },
          }),
          prisma.registryEntry.count({ where }),
          prisma.registryEntry.groupBy({ by: ['direction'], _count: { direction: true } }),
          prisma.registryEntry.groupBy({ by: ['status'],    _count: { status: true } }),
        ])
        return {
          total, byDirection: byDir, byStatus,
          recent: entries.map(e => ({
            ref: e.registryNo, subject: e.subject,
            direction: e.direction, status: e.status,
            priority: e.priority, date: e.dateRegistered,
          })),
        }
      }

      case 'get_audit_summary': {
        const daysBack = toolInput.days || 7
        const since = new Date()
        since.setDate(since.getDate() - daysBack)
        const [logs, total, byAction, byUser] = await Promise.all([
          prisma.auditLog.findMany({
            where: toolInput.userId
              ? { userId: toolInput.userId, createdAt: { gte: since } }
              : toolInput.action
              ? { action: toolInput.action, createdAt: { gte: since } }
              : { createdAt: { gte: since } },
            take: 10, orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, role: true } } },
          }),
          prisma.auditLog.count({ where: { createdAt: { gte: since } } }),
          prisma.auditLog.groupBy({
            by: ['action'], _count: { action: true },
            where: { createdAt: { gte: since } },
            orderBy: { _count: { action: 'desc' } },
          }),
          prisma.auditLog.groupBy({
            by: ['userId'], _count: { userId: true },
            where: { createdAt: { gte: since } },
            orderBy: { _count: { userId: 'desc' } },
            take: 5,
          }),
        ])
        return {
          period: `Last ${daysBack} days`, total,
          byAction, mostActiveUsers: byUser,
          recent: logs.map(l => ({
            user:   l.user.name, role: l.user.role,
            action: l.action,   desc: l.description,
            time:   l.createdAt, ip: l.ipAddress,
          })),
        }
      }

      case 'get_dept_procurement': {
        const where = { department: userDept }
        if (toolInput.status) where.status = toolInput.status
        const [requests, total] = await Promise.all([
          prisma.procurementRequest.findMany({
            where, take: toolInput.limit || 10,
            orderBy: { createdAt: 'desc' },
            include: { requestedBy: { select: { name: true } } },
          }),
          prisma.procurementRequest.count({ where }),
        ])
        const pending = await prisma.procurementRequest.count({
          where: { department: userDept, status: 'PENDING' }
        })
        return {
          department: userDept, total, pending,
          requests: requests.map(r => ({
            ref: r.referenceNo, item: r.itemDescription,
            cost: r.estimatedCost, status: r.status,
            by: r.requestedBy.name, date: r.createdAt,
          })),
        }
      }

      case 'get_dept_activity_logs': {
        const where = { department: userDept }
        if (toolInput.dateFrom) where.logDate = { gte: new Date(toolInput.dateFrom) }
        if (toolInput.dateTo)   where.logDate = { ...where.logDate, lte: new Date(toolInput.dateTo) }
        const [logs, total, agg] = await Promise.all([
          prisma.activityLog.findMany({
            where, take: 10, orderBy: { logDate: 'desc' },
            include: { user: { select: { name: true } } },
          }),
          prisma.activityLog.count({ where }),
          prisma.activityLog.aggregate({ where, _sum: { hoursSpent: true } }),
        ])
        return {
          department: userDept, total,
          totalHours: agg._sum.hoursSpent,
          logs: logs.map(l => ({
            staff: l.user.name, date: l.logDate,
            hours: l.hoursSpent, desc: l.activityDescription.substring(0, 80),
          })),
        }
      }

      case 'get_dept_documents': {
        const where = { department: userDept }
        if (toolInput.category) where.category = toolInput.category
        const [docs, total] = await Promise.all([
          prisma.document.findMany({
            where, take: toolInput.limit || 10,
            orderBy: { createdAt: 'desc' },
            include: { uploader: { select: { name: true } } },
          }),
          prisma.document.count({ where }),
        ])
        return {
          department: userDept, total,
          documents: docs.map(d => ({
            title: d.title, category: d.category,
            by: d.uploader.name, date: d.createdAt,
          })),
        }
      }

      case 'get_pending_approvals': {
        const requests = await prisma.procurementRequest.findMany({
          where:   { department: userDept, status: 'PENDING' },
          include: { requestedBy: { select: { name: true } } },
          orderBy: { createdAt: 'asc' },
        })
        return {
          count: requests.length,
          requests: requests.map(r => ({
            ref:  r.referenceNo, item: r.itemDescription,
            cost: r.estimatedCost, by: r.requestedBy.name,
            date: r.createdAt, justification: r.justification,
          })),
        }
      }

      case 'get_dept_overview': {
        const [procTotal, procPending, logTotal, docTotal, totalHours] =
          await Promise.all([
            prisma.procurementRequest.count({ where: { department: userDept } }),
            prisma.procurementRequest.count({
              where: { department: userDept, status: 'PENDING' }
            }),
            prisma.activityLog.count({ where: { department: userDept } }),
            prisma.document.count({ where: { department: userDept } }),
            prisma.activityLog.aggregate({
              where: { department: userDept },
              _sum:  { hoursSpent: true },
            }),
          ])
        return {
          department:   userDept,
          procurement:  { total: procTotal, pending: procPending },
          activityLogs: { total: logTotal },
          documents:    { total: docTotal },
          totalHours:   totalHours._sum.hoursSpent,
        }
      }

      case 'get_my_procurement_requests': {
        const where = { requestedById: userId }
        if (toolInput.status) where.status = toolInput.status
        const requests = await prisma.procurementRequest.findMany({
          where, orderBy: { createdAt: 'desc' }, take: 10,
        })
        return {
          total: requests.length,
          requests: requests.map(r => ({
            ref:    r.referenceNo, item: r.itemDescription,
            cost:   r.estimatedCost, status: r.status,
            date:   r.createdAt,
            deptHeadDecision: r.deptHeadApproval,
            gmDecision:       r.gmApproval,
            comment:          r.gmComment || r.deptHeadComment,
          })),
        }
      }

      case 'get_my_activity_logs': {
        const logs = await prisma.activityLog.findMany({
          where: { userId }, take: toolInput.limit || 10,
          orderBy: { logDate: 'desc' },
        })
        const totalHours = await prisma.activityLog.aggregate({
          where: { userId }, _sum: { hoursSpent: true },
        })
        return {
          total: logs.length,
          totalHours: totalHours._sum.hoursSpent,
          logs: logs.map(l => ({
            date: l.logDate, hours: l.hoursSpent,
            desc: l.activityDescription.substring(0, 100) + '...',
          })),
        }
      }

      case 'check_todays_log': {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayLog = await prisma.activityLog.findFirst({
          where: { userId, logDate: { gte: today } }
        })
        return {
          submitted:   !!todayLog,
          log:         todayLog ? {
            hours: todayLog.hoursSpent,
            desc:  todayLog.activityDescription.substring(0, 80),
            time:  todayLog.createdAt,
          } : null,
          message: todayLog
            ? "You have already submitted your activity log for today."
            : "You have NOT submitted your activity log for today. Remember to submit before end of day.",
        }
      }

      case 'get_my_overview': {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const [myRequests, myLogs, todayLog] = await Promise.all([
          prisma.procurementRequest.findMany({
            where: { requestedById: userId },
            orderBy: { createdAt: 'desc' }, take: 3,
          }),
          prisma.activityLog.count({ where: { userId } }),
          prisma.activityLog.findFirst({ where: { userId, logDate: { gte: today } } }),
        ])
        return {
          todayLogSubmitted: !!todayLog,
          totalLogs:         myLogs,
          recentRequests:    myRequests.map(r => ({
            ref: r.referenceNo, item: r.itemDescription,
            status: r.status, date: r.createdAt,
          })),
        }
      }

      case 'search_documents': {
        const docs = await prisma.document.findMany({
          where: {
            AND: [
              { title: { contains: toolInput.query } },
              toolInput.category ? { category: toolInput.category } : {},
            ],
          },
          take: 5,
          include: { uploader: { select: { name: true } } },
        })
        return {
          query:   toolInput.query,
          results: docs.length,
          documents: docs.map(d => ({
            title: d.title, category: d.category,
            dept: d.department, by: d.uploader.name,
            date: d.createdAt,
          })),
        }
      }

      case 'get_user_list': {
        const where = {}
        if (toolInput.role)     where.role     = toolInput.role
        if (toolInput.isActive !== undefined) where.isActive = toolInput.isActive
        const users = await prisma.user.findMany({
          where,
          select: {
            id: true, name: true, email: true,
            role: true, department: true, isActive: true,
          },
          orderBy: { role: 'asc' },
        })
        return { total: users.length, users }
      }

      case 'get_security_report': {
        const days  = toolInput.days || 7
        const since = new Date()
        since.setDate(since.getDate() - days)
        const [deletes, logins, userChanges] = await Promise.all([
          prisma.auditLog.findMany({
            where:   { action: 'DOCUMENT_DELETE', createdAt: { gte: since } },
            include: { user: { select: { name: true, role: true } } },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.auditLog.count({
            where: { action: 'LOGIN', createdAt: { gte: since } }
          }),
          prisma.auditLog.findMany({
            where: {
              action:    { in: ['USER_CREATED', 'USER_UPDATED', 'USER_DEACTIVATED'] },
              createdAt: { gte: since },
            },
            include: { user: { select: { name: true } } },
          }),
        ])
        return {
          period:      `Last ${days} days`,
          logins,
          deletions:   deletes.length,
          deleteEvents: deletes.map(d => ({
            by: d.user.name, desc: d.description, time: d.createdAt
          })),
          userChanges: userChanges.map(u => ({
            by: u.user.name, action: u.action, desc: u.description, time: u.createdAt
          })),
        }
      }

      case 'get_system_health': {
        const [docs, proc, logs, reg, users, audit] = await Promise.all([
          prisma.document.count(),
          prisma.procurementRequest.count(),
          prisma.activityLog.count(),
          prisma.registryEntry.count(),
          prisma.user.count(),
          prisma.auditLog.count(),
        ])
        return {
          databaseRecords: {
            documents:          docs,
            procurementRequests: proc,
            activityLogs:        logs,
            registryEntries:     reg,
            users,
            auditLogs:           audit,
            total: docs + proc + logs + reg + users + audit,
          },
          status: 'HEALTHY',
          checkedAt: new Date().toISOString(),
        }
      }

      case 'get_audit_anomalies': {
        const days  = toolInput.days || 30
        const since = new Date()
        since.setDate(since.getDate() - days)
        const deletes = await prisma.auditLog.findMany({
          where:   { action: 'DOCUMENT_DELETE', createdAt: { gte: since } },
          include: { user: { select: { name: true, role: true } } },
        })
        return {
          period:   `Last ${days} days`,
          anomalies: deletes.length,
          deletions: deletes.map(d => ({
            by:   d.user.name, role: d.user.role,
            desc: d.description, time: d.createdAt,
          })),
          summary: deletes.length === 0
            ? 'No anomalies detected in the audit trail.'
            : `${deletes.length} document deletion(s) detected in the last ${days} days.`,
        }
      }

      case 'get_procurement_audit': {
        const where = {}
        if (toolInput.department) where.department = { contains: toolInput.department }
        const [all, approved, rejected, highCost] = await Promise.all([
          prisma.procurementRequest.count({ where }),
          prisma.procurementRequest.count({ where: { ...where, status: 'APPROVED' } }),
          prisma.procurementRequest.findMany({
            where: { ...where, status: 'REJECTED' },
            include: { requestedBy: { select: { name: true } } },
          }),
          prisma.procurementRequest.findMany({
            where: { ...where, estimatedCost: { gt: 2000000 } },
            include: { requestedBy: { select: { name: true } } },
            orderBy: { estimatedCost: 'desc' },
            take: 5,
          }),
        ])
        return {
          total: all, approved,
          rejected: rejected.map(r => ({
            ref: r.referenceNo, item: r.itemDescription,
            cost: r.estimatedCost, dept: r.department,
            by: r.requestedBy.name, reason: r.gmComment || r.deptHeadComment,
          })),
          highValueRequests: highCost.map(r => ({
            ref: r.referenceNo, cost: r.estimatedCost,
            status: r.status, item: r.itemDescription,
          })),
        }
      }

      case 'get_compliance_report': {
        const dateFrom = toolInput.dateFrom
          ? new Date(toolInput.dateFrom)
          : new Date(new Date().setDate(new Date().getDate() - 30))
        const dateTo = toolInput.dateTo
          ? new Date(toolInput.dateTo)
          : new Date()
        const [byDept, staffTotal] = await Promise.all([
          prisma.activityLog.groupBy({
            by: ['department'],
            _count: { department: true },
            _sum:   { hoursSpent: true },
            where:  { logDate: { gte: dateFrom, lte: dateTo } },
          }),
          prisma.user.count({ where: { isActive: true } }),
        ])
        return {
          period: { from: dateFrom, to: dateTo },
          byDepartment: byDept,
          totalStaff: staffTotal,
          note: 'Compliance rate = log entries submitted / expected entries for the period',
        }
      }

      case 'get_document_access_log': {
        const days  = toolInput.days || 7
        const since = new Date()
        since.setDate(since.getDate() - days)
        const logs = await prisma.auditLog.findMany({
          where: {
            action:    { in: ['DOCUMENT_UPLOAD', 'DOCUMENT_DOWNLOAD', 'DOCUMENT_DELETE'] },
            createdAt: { gte: since },
          },
          include: { user: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        })
        return {
          period: `Last ${days} days`,
          total:  logs.length,
          events: logs.map(l => ({
            action: l.action, by: l.user.name,
            role: l.user.role, desc: l.description,
            time: l.createdAt,
          })),
        }
      }

      case 'get_pending_registry': {
        const entries = await prisma.registryEntry.findMany({
          where:   { status: { in: ['PENDING', 'DISPATCHED'] } },
          include: { handledBy: { select: { name: true } } },
          orderBy: { dateRegistered: 'asc' },
        })
        return {
          count: entries.length,
          entries: entries.map(e => ({
            ref: e.registryNo, subject: e.subject,
            direction: e.direction, status: e.status,
            priority: e.priority, since: e.dateRegistered,
            handledBy: e.handledBy.name,
          })),
        }
      }

      case 'search_registry': {
        const where = {
          OR: [
            { subject:    { contains: toolInput.query } },
            { registryNo: { contains: toolInput.query } },
            { source:     { contains: toolInput.query } },
          ],
        }
        if (toolInput.direction) where.direction = toolInput.direction
        const entries = await prisma.registryEntry.findMany({
          where, take: 5,
          include: { handledBy: { select: { name: true } } },
        })
        return {
          query:   toolInput.query,
          results: entries.length,
          entries: entries.map(e => ({
            ref:       e.registryNo, subject: e.subject,
            direction: e.direction,  status: e.status,
            date:      e.dateRegistered,
          })),
        }
      }

      case 'get_registry_analytics': {
        const [byDir, byType, byStatus, total] = await Promise.all([
          prisma.registryEntry.groupBy({ by: ['direction'], _count: { direction: true } }),
          prisma.registryEntry.groupBy({ by: ['docType'],   _count: { docType: true } }),
          prisma.registryEntry.groupBy({ by: ['status'],    _count: { status: true } }),
          prisma.registryEntry.count(),
        ])
        return { total, byDirection: byDir, byDocType: byType, byStatus }
      }

      default:
        return { error: `Unknown tool: ${toolName}` }
    }
  } catch (error) {
    console.error(`Tool ${toolName} failed:`, error)
    return { error: error.message }
  }
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return unauthorizedResponse()

    const body = await request.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return errorResponse('Messages array is required')
    }

    // Get role-specific system prompt and tools
    const userRole    = session.user.role
    const date        = new Date().toLocaleDateString('en-GB', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    })
    const systemPrompt = SYSTEM_PROMPTS[userRole]
      ? SYSTEM_PROMPTS[userRole](session.user, date)
      : SYSTEM_PROMPTS.STAFF(session.user, date)

    const allowedToolNames = TOOLS_BY_ROLE[userRole] || TOOLS_BY_ROLE.STAFF
    const tools = allowedToolNames.map(name => ALL_TOOLS[name]).filter(Boolean)

    // Build message history
    let currentMessages = messages
      .filter(m => m.id !== 0)
      .map(m => ({
        role:    m.role === 'ai' ? 'assistant' : 'user',
        content: String(m.text),
      }))

    // Agentic loop
    let response
    let iterations = 0
    const MAX_ITERATIONS = 8

    while (iterations < MAX_ITERATIONS) {
      iterations++

      response = await anthropic.messages.create({
        model:      'claude-sonnet-4-6',
        max_tokens: 1500,
        system:     systemPrompt,
        tools,
        messages:   currentMessages,
      })

      if (response.stop_reason === 'end_turn') break

      if (response.stop_reason === 'tool_use') {
        currentMessages.push({
          role:    'assistant',
          content: response.content,
        })

        const toolResults = []
        for (const block of response.content) {
          if (block.type === 'tool_use') {
            const result = await executeTool(block.name, block.input, session)
            toolResults.push({
              type:        'tool_result',
              tool_use_id: block.id,
              content:     JSON.stringify(result),
            })
          }
        }

        currentMessages.push({ role: 'user', content: toolResults })
        continue
      }

      break
    }

    const finalText = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')

    return Response.json({ success: true, message: finalText })
  } catch (error) {
    console.error('AI Agent error:', error)
    return serverErrorResponse(error)
  }
}
