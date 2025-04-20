import { json } from "@remix-run/node";
import  prisma  from "../db.server";

// GET /api/submissions - Get all submissions with optional filters
export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const query = searchParams.get("query") || "";
    const status = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const sortKey = searchParams.get("sortKey") || "createdAt";
    const sortDirection = searchParams.get("sortDirection") || "desc";
    const perPage = 10;

    const where = {
      ...(query && {
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { projectName: { contains: query, mode: "insensitive" } },
        ],
      }),
      ...(status !== "all" && { status }),
    };

    const [submissions, total] = await Promise.all([
      prisma.projectSubmission.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { [sortKey]: sortDirection },
        include: {
          product: true,
          images: true,
        },
      }),
      prisma.projectSubmission.count({ where }),
    ]);

    return json({
      submissions,
      total,
      page,
      perPage,
      query,
      status,
      sortKey,
      sortDirection,
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}

// POST /api/submissions - Create a new submission
export async function action({ request }) {
  try {
    if (request.method === "POST") {
      const data = await request.json();
      
      // Validate required fields
      const requiredFields = [
        "firstName",
        "lastName",
        "email",
        "projectName",
        "patternName",
        "designerName",
        "patternLink",
        "product",
        "nameDisplay",
        "socialMedia",
      ];

      for (const field of requiredFields) {
        if (!data[field]) {
          return json(
            { error: `Missing required field: ${field}` },
            { status: 400 }
          );
        }
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return json({ error: "Invalid email format" }, { status: 400 });
      }

      // Validate product data
      if (!data.product || !data.product.shopifyId) {
        return json({ error: "Invalid product data" }, { status: 400 });
      }

      // Create submission
      const submission = await prisma.projectSubmission.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          projectName: data.projectName,
          patternName: data.patternName,
          designerName: data.designerName,
          patternLink: data.patternLink,
          product: {
            create: {
              shopifyId: data.product.id,
              title: data.product.title,
              handle: data.product.handle,
              imageUrl: data.product.imageUrl,
              price: data.product.price,
              currency: data.product.currency,
              variantId: data.product.variantId,
              variantTitle: data.product.variantTitle,
              selectedOption: JSON.stringify(data.product.options || {}),
            }
          },
          nameDisplayPreference: data.nameDisplay,
          socialMediaHandle: data.socialMedia,
          status: "pending",
          submittedAt: new Date(),
          images: {
            create: data.images?.map((image) => ({
              url: image.url,
              filename: image.url.split('/').pop() || 'image.jpg',
              size: 0,
              mimetype: 'image/jpeg',
            })) || [],
          },
        },
        include: {
          product: true,
          images: true,
        },
      });

      return json({ submission }, { status: 201 });
    }

    // PUT /api/submissions/:id - Update submission status
    if (request.method === "PUT") {
      const url = new URL(request.url);
      const id = url.pathname.split("/").pop();
      const data = await request.json();

      if (!id) {
        return json({ error: "Missing submission ID" }, { status: 400 });
      }

      if (!data.status) {
        return json({ error: "Missing status" }, { status: 400 });
      }

      const validStatuses = ["pending", "approved", "rejected"];
      if (!validStatuses.includes(data.status)) {
        return json({ error: "Invalid status" }, { status: 400 });
      }

      const submission = await prisma.projectSubmission.update({
        where: { id },
        data: { status: data.status },
        include: {
          product: true,
          images: true,
        },
      });

      return json({ submission });
    }

    // DELETE /api/submissions/:id - Delete a submission
    if (request.method === "DELETE") {
      const url = new URL(request.url);
      const id = url.pathname.split("/").pop();

      if (!id) {
        return json({ error: "Missing submission ID" }, { status: 400 });
      }

      await prisma.projectSubmission.delete({
        where: { id },
      });

      return json({ success: true });
    }

    return json({ error: "Method not allowed" }, { status: 405 });
  } catch (error) {
    console.error("Error processing submission:", error);
    return json({ error: "Failed to process submission" }, { status: 500 });
  }
} 