import { NextResponse, type NextRequest } from 'next/server'

/**
 * GET /api/lms/student-link?civilId=XXXXXXXXXX
 *
 * Builds a deep link into the Moodle LMS "Browse list of users" page,
 * pre-searching for the student by their Civil ID (which is stored in the
 * student's last name field in Moodle), then 302-redirects the browser there.
 *
 * The Moodle site address is read server-side from MOODLE_BASE_URL (the same
 * env var the sync integration uses), so it never has to be exposed to the client.
 */
export async function GET(req: NextRequest) {
  const civilId = req.nextUrl.searchParams.get('civilId')?.trim()

  if (!civilId) {
    return NextResponse.json({ error: 'civilId is required' }, { status: 400 })
  }

  const baseUrl = process.env.MOODLE_BASE_URL
  if (!baseUrl) {
    return NextResponse.json(
      { error: 'Moodle is not configured. Set the MOODLE_BASE_URL environment variable.' },
      { status: 500 }
    )
  }

  // Moodle "Browse list of users" with the realname filter pre-applied.
  // The civil id lives in the last name field, so a "contains" search on the
  // full name finds the student. (op 0 = contains.)
  const target = new URL('/admin/user.php', baseUrl.replace(/\/+$/, ''))
  target.searchParams.set('realname', civilId)
  target.searchParams.set('realname_op', '0')
  target.searchParams.set('addfilter', '1')
  target.searchParams.set('sort', 'name')
  target.searchParams.set('dir', 'ASC')
  target.searchParams.set('perpage', '30')

  return NextResponse.redirect(target.toString())
}
