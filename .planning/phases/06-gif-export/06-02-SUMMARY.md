# Plan 06-02 Summary: JSON Export/Import

## Completed: 2026-01-13

## What Was Built

### Task 1: Export/Import Utility & API
- **src/lib/export.ts**: Core export/import logic
  - `ExportData` interface with version, timestamp, biases, tags, and links
  - `exportAllData()`: Fetches all data from Supabase with proper joins
  - `validateImportData()`: Validates JSON structure before import
  - `importData()`: Imports data with duplicate handling (skip existing URLs, match by name for biases/tags)
  - `ImportResult` type for detailed feedback on import operations

- **src/app/api/export/route.ts**: GET endpoint
  - Returns complete archive data as downloadable JSON
  - Sets `Content-Disposition: attachment` header with dated filename

- **src/app/api/import/route.ts**: POST endpoint
  - Accepts JSON body with ExportData structure
  - Validates data before processing
  - Returns detailed import results

### Task 2: Export/Import UI
- **src/components/ExportModal.tsx**: Modal with two tabs
  - **Export tab**: Shows statistics (links/tags/biases count), "JSON 다운로드" button
  - **Import tab**: File upload area, preview of import data, result display with skipped/imported counts
  - Portal-based modal with dark mode support
  - ESC key and backdrop click to close

- **src/components/Sidebar.tsx**: Updated
  - Added "데이터 관리" button at bottom with exchange icon
  - Triggers ExportModal on click
  - Refreshes data after successful import

## Technical Decisions
1. **Duplicate handling**: URLs are unique identifiers for links; biases/tags matched by name
2. **Data preservation**: Import only adds new data, never overwrites existing
3. **Export format**: JSON with version field for future compatibility
4. **Media support**: Link media is included in export and properly restored on import

## Verification
- [x] npm run build succeeds
- [x] GET /api/export returns JSON
- [x] Export/Import UI accessible from Sidebar
- [x] Dark mode support

## Files Changed
- `src/lib/export.ts` (new)
- `src/app/api/export/route.ts` (new)
- `src/app/api/import/route.ts` (new)
- `src/components/ExportModal.tsx` (new)
- `src/components/Sidebar.tsx` (modified)
