import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

type RouteParams = {
  params: Promise<{ id: string }>
}

/**
 * DELETE /api/groups/[id]
 * Delete a group and all its members (requires authentication)
 * Query params:
 * - deleteLinks: 'true' to also delete related links
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const deleteLinks = searchParams.get('deleteLinks') === 'true'

    // Get group and its biases info before deletion (for tag names)
    const { data: group } = await supabase
      .from('groups')
      .select('name, name_en, name_ko')
      .eq('id', id)
      .single()

    const { data: biases } = await supabase
      .from('biases')
      .select('name, name_en, name_ko')
      .eq('group_id', id)

    // Collect all tag names to search for (group name + all member names)
    const tagNames: string[] = []
    if (group) {
      if (group.name) tagNames.push(group.name)
      if (group.name_en) tagNames.push(group.name_en)
      if (group.name_ko) tagNames.push(group.name_ko)
    }
    if (biases) {
      for (const bias of biases) {
        if (bias.name) tagNames.push(bias.name)
        if (bias.name_en) tagNames.push(bias.name_en)
        if (bias.name_ko) tagNames.push(bias.name_ko)
      }
    }

    // Delete related links if requested
    if (deleteLinks && tagNames.length > 0) {
      // Find tags matching the group/member names
      const { data: tags } = await supabase
        .from('tags')
        .select('id')
        .in('name', tagNames)

      if (tags && tags.length > 0) {
        const tagIds = tags.map(t => t.id)

        // Find links that have these tags
        const { data: linkTags } = await supabase
          .from('link_tags')
          .select('link_id')
          .in('tag_id', tagIds)

        if (linkTags && linkTags.length > 0) {
          const linkIds = [...new Set(linkTags.map(lt => lt.link_id))]

          // Delete the links (link_tags will cascade delete)
          const { error: linksError } = await supabase
            .from('links')
            .delete()
            .in('id', linkIds)

          if (linksError) throw linksError
        }

        // Delete the tags themselves
        const { error: tagsError } = await supabase
          .from('tags')
          .delete()
          .in('id', tagIds)

        if (tagsError) throw tagsError
      }
    }

    // Delete all biases belonging to this group
    const { error: biasesError } = await supabase
      .from('biases')
      .delete()
      .eq('group_id', id)

    if (biasesError) throw biasesError

    // Delete the group itself
    const { error: groupError } = await supabase
      .from('groups')
      .delete()
      .eq('id', id)

    if (groupError) throw groupError
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json(
      { error: '그룹을 삭제하는데 실패했습니다' },
      { status: 500 }
    )
  }
}
