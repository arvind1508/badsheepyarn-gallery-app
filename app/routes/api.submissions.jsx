import { json } from "@remix-run/node";
import prisma  from "../db.server";
import { authenticate } from "../shopify.server";

// GET /api/submissions - Get all submissions with pagination and filtering
export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);
  console.log( prisma,'prisma')
  
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const status = url.searchParams.get("status");
    const skip = (page - 1) * limit;

    // Build the where clause based on status
    const where = status && status !== "all" ? { status } : {};

    // Get total count for pagination
    const total = await prisma.ProjectSubmission.count({ where });

    // Get submissions with pagination and filtering
    const submissions = await prisma.ProjectSubmission.findMany({
      where,
      include: {
        product: true,
        images: true
      },
      orderBy: {
        submittedAt: 'desc'
      },
      skip,
      take: limit
    });

    return json({ 
      submissions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

// POST /api/submissions - Create a new submission
export async function action({ request }) {
  const { admin } = await authenticate.admin(request);

  if (request.method === "POST") {
    try {
      const formData = await request.formData();
      const data = Object.fromEntries(formData);
      
      // Handle file uploads
      const images = [];
      const files = formData.getAll('images');
      
      for (const file of files) {
        if (file instanceof File) {
          // Upload to Shopify media
          const upload = await admin.rest.resources.Asset.create({
            key: `submissions/${Date.now()}-${file.name}`,
            input: {
              contentType: file.type,
              body: await file.arrayBuffer()
            }
          });

          images.push({
            url: upload.public_url,
            filename: file.name,
            size: file.size,
            mimetype: file.type
          });
        }
      }

      // Create submission
      const submission = await prisma.ProjectSubmission.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          projectName: data.projectName,
          patternName: data.patternName,
          designerName: data.designerName,
          patternLink: data.patternLink,
          productId: data.productId,
          nameDisplayPreference: data.nameDisplayPreference,
          socialMediaHandle: data.socialMediaHandle,
          images: {
            create: images
          },
          status: 'pending'
        },
        include: {
          product: true,
          images: true
        }
      });

      return json({ submission }, { status: 201 });
    } catch (error) {
      console.error('Error creating submission:', error);
      return json({ error: 'Failed to create submission' }, { status: 500 });
    }
  }

  // PUT /api/submissions/:id - Update submission status
  if (request.method === "PUT") {
    try {
      const { id, status, rejectionReason } = await request.json();

      const submission = await prisma.ProjectSubmission.update({
        where: { id },
        data: {
          status,
          ...(status === 'rejected' && { rejectionReason }),
          ...(status === 'approved' && { approvedAt: new Date() }),
          ...(status === 'rejected' && { rejectedAt: new Date() })
        },
        include: {
          product: true,
          images: true
        }
      });

      return json({ submission });
    } catch (error) {
      console.error('Error updating submission:', error);
      return json({ error: 'Failed to update submission' }, { status: 500 });
    }
  }

  // DELETE /api/submissions/:id - Delete a submission
  if (request.method === "DELETE") {
    try {
      const { id } = await request.json();
      
      await prisma.ProjectSubmission.delete({
        where: { id }
      });

      return json({ success: true });
    } catch (error) {
      console.error('Error deleting submission:', error);
      return json({ error: 'Failed to delete submission' }, { status: 500 });
    }
  }

  return json({ error: 'Method not allowed' }, { status: 405 });
} 