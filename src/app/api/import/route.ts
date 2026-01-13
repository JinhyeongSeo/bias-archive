import { NextRequest, NextResponse } from 'next/server'
import { validateImportData, importData } from '@/lib/export'

/**
 * POST /api/import
 * Import archive data from a JSON file
 * Body: ExportData JSON structure
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate the import data structure
    const validatedData = validateImportData(body)
    if (!validatedData) {
      return NextResponse.json(
        { error: '유효하지 않은 백업 파일 형식입니다' },
        { status: 400 }
      )
    }

    // Perform the import
    const result = await importData(validatedData)

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error('Error importing data:', error)
    return NextResponse.json(
      { error: '데이터 가져오기에 실패했습니다' },
      { status: 500 }
    )
  }
}
