import { NextResponse } from 'next/server'
import { exportAllData } from '@/lib/export'

/**
 * GET /api/export
 * Export all archive data as a downloadable JSON file
 */
export async function GET() {
  try {
    const data = await exportAllData()

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const filename = `bias-archive-backup-${date}.json`

    // Return as downloadable JSON file
    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { error: '데이터 내보내기에 실패했습니다' },
      { status: 500 }
    )
  }
}
