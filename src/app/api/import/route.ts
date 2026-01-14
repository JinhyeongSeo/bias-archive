import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { validateImportData, type ExportData, type ImportResult } from '@/lib/export'

/**
 * POST /api/import
 * Import archive data from a JSON file (requires authentication)
 * Body: ExportData JSON structure
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate the import data structure
    const validatedData = validateImportData(body)
    if (!validatedData) {
      return NextResponse.json(
        { error: '유효하지 않은 백업 파일 형식입니다' },
        { status: 400 }
      )
    }

    // Perform the import with authenticated client
    const result = await importDataWithClient(supabase, validatedData, user.id)

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

/**
 * Import data using authenticated Supabase client
 */
async function importDataWithClient(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: ExportData,
  userId: string
): Promise<ImportResult> {
  const result: ImportResult = {
    imported: { biases: 0, tags: 0, links: 0 },
    skipped: { biases: 0, tags: 0, links: 0 },
    errors: [],
  }

  const biasIdMap = new Map<string, string>()
  const tagIdMap = new Map<string, string>()

  // 1. Import biases
  for (const bias of data.biases) {
    try {
      const { data: existing } = await supabase
        .from('biases')
        .select('id')
        .eq('name', bias.name)
        .limit(1)

      if (existing && existing.length > 0) {
        biasIdMap.set(bias.id, existing[0].id)
        result.skipped.biases++
      } else {
        const { data: newBias, error } = await supabase
          .from('biases')
          .insert({
            name: bias.name,
            group_name: bias.group_name,
            user_id: userId,
          })
          .select()
          .single()

        if (error) {
          result.errors.push(`Bias "${bias.name}": ${error.message}`)
        } else {
          biasIdMap.set(bias.id, newBias.id)
          result.imported.biases++
        }
      }
    } catch (error) {
      result.errors.push(`Bias "${bias.name}": ${String(error)}`)
    }
  }

  // 2. Import tags
  for (const tag of data.tags) {
    try {
      const { data: existing } = await supabase
        .from('tags')
        .select('id')
        .eq('name', tag.name)
        .limit(1)

      if (existing && existing.length > 0) {
        tagIdMap.set(tag.id, existing[0].id)
        result.skipped.tags++
      } else {
        const { data: newTag, error } = await supabase
          .from('tags')
          .insert({ name: tag.name, user_id: userId })
          .select()
          .single()

        if (error) {
          result.errors.push(`Tag "${tag.name}": ${error.message}`)
        } else {
          tagIdMap.set(tag.id, newTag.id)
          result.imported.tags++
        }
      }
    } catch (error) {
      result.errors.push(`Tag "${tag.name}": ${String(error)}`)
    }
  }

  // 3. Import links
  for (const link of data.links) {
    try {
      const { data: existing } = await supabase
        .from('links')
        .select('id')
        .eq('url', link.url)
        .limit(1)

      if (existing && existing.length > 0) {
        result.skipped.links++
        continue
      }

      const newBiasId = link.bias_id ? biasIdMap.get(link.bias_id) : null

      const { data: newLink, error: linkError } = await supabase
        .from('links')
        .insert({
          url: link.url,
          title: link.title,
          description: link.description,
          thumbnail_url: link.thumbnail_url,
          platform: link.platform,
          original_date: link.original_date,
          author_name: link.author_name,
          bias_id: newBiasId || null,
          user_id: userId,
        })
        .select()
        .single()

      if (linkError) {
        result.errors.push(`Link "${link.url}": ${linkError.message}`)
        continue
      }

      result.imported.links++

      // Import link tags
      if (link.tags && link.tags.length > 0) {
        for (const tag of link.tags) {
          const newTagId = tagIdMap.get(tag.id)
          if (newTagId) {
            try {
              await supabase.from('link_tags').insert({
                link_id: newLink.id,
                tag_id: newTagId,
              })
            } catch {
              // Ignore duplicate
            }
          }
        }
      }

      // Import link media
      if (link.media && link.media.length > 0) {
        for (const media of link.media) {
          try {
            await supabase.from('link_media').insert({
              link_id: newLink.id,
              media_url: media.media_url,
              media_type: media.media_type,
              position: media.position,
            })
          } catch (error) {
            result.errors.push(`Media for "${link.url}": ${String(error)}`)
          }
        }
      }
    } catch (error) {
      result.errors.push(`Link "${link.url}": ${String(error)}`)
    }
  }

  return result
}
