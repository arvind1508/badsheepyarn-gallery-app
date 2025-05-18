import { json } from "@remix-run/node";
import prisma from "../db.server";

/**
 * Public API endpoint to fetch approved submissions
 * This endpoint does not require authentication and will only return approved submissions
 */
export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const shop = searchParams.get("shop") || ""; // Filter by shop domain
    const query = searchParams.get("query") || ""; // Search term
    const search = searchParams.get("search") || query; // Support both 'query' and 'search' parameters
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "12");
    
    // Get sort parameters - support both formats:
    // 1. sortKey & sortDirection
    // 2. single 'sort' parameter (newest, oldest, az, za)
    let sortKey = searchParams.get("sortKey") || "approvedAt";
    let sortDirection = searchParams.get("sortDirection") || "desc";
    
    // Handle the frontend 'sort' parameter if provided
    const sort = searchParams.get("sort");
    if (sort) {
      switch (sort) {
        case 'newest':
          sortKey = "approvedAt";
          sortDirection = "desc";
          break;
        case 'oldest':
          sortKey = "approvedAt";
          sortDirection = "asc";
          break;
        case 'az':
          sortKey = "projectName";
          sortDirection = "asc";
          break;
        case 'za':
          sortKey = "projectName";
          sortDirection = "desc";
          break;
        case 'popular':
          // Default to newest since we don't have popularity metrics yet
          sortKey = "approvedAt";
          sortDirection = "desc";
          break;
      }
    }
    
    const category = searchParams.get("category") || ""; // Optional category filter

    console.log("API Request Parameters:", {
      shop,
      search,
      category,
      sort,
      sortKey,
      sortDirection,
      page,
      perPage
    });

    // Construct the where clause for the query
    const where = {
      status: "approved", // Only return approved submissions
      ...(shop && { shop }), // Filter by shop if provided
      ...(search && {
        OR: [
          { projectName: { contains: search, mode: "insensitive" } },
          // Search product title if available
          {
            product: {
              title: { contains: search, mode: "insensitive" }
            }
          }
        ],
      }),
    };


    // Add category filter if provided - handle both array and string formats
    if (category && category !== 'all') {
      try {
        // For PostgreSQL array type, different Prisma versions have different query methods
        where.OR = [
          ...(where.OR || []),
          // Try multiple approaches to query arrays depending on the Prisma version and database
          //if case sensitive, use has, if case insensitive, use hasSome 
          { categories: { has: category.toUpperCase() } },
          { categories: { hasSome: [category.toUpperCase()] } }
        ];
      } catch (error) {
        console.error("Error adding category filter:", error);
        // Fallback to just the string matching if array queries fail
        where.OR = [
          ...(where.OR || []),
          { category: { contains: category, mode: "insensitive" } }
        ];
      }
    }

    console.log("Query where clause:", JSON.stringify(where, null, 2));

    // Fetch submissions with pagination
    const [submissions, total] = await Promise.all([
      prisma.projectSubmission.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { [sortKey]: sortDirection },
        select: {
          id: true,
          projectName: true,
          patternName: true,
          designerName: true,
          patternLink: true,
          nameDisplayPreference: true,
          socialMediaHandle: true,
          approvedAt: true,
          createdAt: true,
          firstName: true,
          lastName: true,
          shop: true,
          categories: true,
          // Include related data but exclude sensitive information
          product: {
            select: {
              id: true,
              title: true,
              handle: true,
              price: true,
              imageUrl: true,
              selectedOption: true
            }
          },
          images: {
            select: {
              id: true,
              url: true
            }
          }
        }
      }),
      prisma.projectSubmission.count({ where }),
    ]);

    // Format the submissions to include displayName based on nameDisplayPreference
    const formattedSubmissions = submissions.map(submission => {
      // Calculate display name based on nameDisplayPreference
      let displayName;
      switch (submission.nameDisplayPreference) {
        case 'full':
          displayName = `${submission.firstName} ${submission.lastName}`;
          break;
        case 'first':
          displayName = submission.firstName;
          break;
        case 'initials':
          displayName = `${submission.firstName.charAt(0)}.${submission.lastName.charAt(0)}.`;
          break;
        case 'anonymous':
          displayName = 'Anonymous';
          break;
        default:
          displayName = `${submission.firstName} ${submission.lastName}`;
      }

      // Remove sensitive information
      const { firstName, lastName, ...rest } = submission;
      
      return {
        ...rest,
        displayName
      };
    });

    // Add CORS headers for public accessibility
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
    };

    return json({
      submissions: formattedSubmissions,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage)
    }, { headers });
  } catch (error) {
    console.error("Error fetching public submissions:", error);
    return json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}

// Handle OPTIONS request for CORS preflight
export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
    });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
} 