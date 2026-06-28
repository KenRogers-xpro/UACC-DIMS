export function unauthorizedResponse() {
  return Response.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  )
}

export function serverErrorResponse(error) {
  console.error('API Server Error:', error)
  return Response.json(
    { success: false, error: error.message || 'Internal Server Error' },
    { status: 500 }
  )
}

export function errorResponse(message, status = 400) {
  return Response.json(
    { success: false, error: message },
    { status }
  )
}
