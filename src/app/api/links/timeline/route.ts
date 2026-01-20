import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { getLinksOnThisDay } from "@/lib/links";
import { createClient } from "@/lib/supabase-server";
import { handleApiError, badRequest } from "@/lib/api-error";

/**
 * GET /api/links/timeline
 * Get links saved on this day in past years ("On This Day" feature)
 * Query params:
 * - years: how many years back to look (default: 1)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearsParam = searchParams.get("years");
    const years = yearsParam ? parseInt(yearsParam, 10) : 1;

    // Validate years parameter
    if (isNaN(years) || years < 1 || years > 10) {
      badRequest("years 파라미터는 1-10 사이의 숫자여야 합니다");
    }

    // Create server-side authenticated client
    const supabase = await createClient();

    const links = await getLinksOnThisDay(years, supabase);

    // Return empty array if no content found (client can decide how to handle)
    return NextResponse.json(links);
  } catch (error) {
    return handleApiError(error);
  }
}
