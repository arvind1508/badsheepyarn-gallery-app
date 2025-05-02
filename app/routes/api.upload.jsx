import {
  json,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData,
} from "@remix-run/node";

import { s3UploadHandler } from "../utils/s3.server";

// Add CORS headers helper function
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const loader = async ({ request }) => {
  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  return json({ message: "Method not allowed" }, { status: 405 });
};

export const action = async ({ request }) => {
  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  if (request.method !== 'POST') {
    return json(
      { error: 'Method not allowed' }, 
      { 
        status: 405,
        headers: corsHeaders
      }
    );
  }

  try {
    const uploadHandler = composeUploadHandlers(
      s3UploadHandler,
      createMemoryUploadHandler(),
    );
    
    const formData = await parseMultipartFormData(request, uploadHandler);
    const imgSrc = formData.get("img");
    const imgDesc = formData.get("desc");

    if (!imgSrc) {
      return json(
        {
          success: false,
          error: "Something went wrong while uploading"
        }, 
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    return json(
      {
        success: true,
        data: {
          imageUrl: imgSrc,
          description: imgDesc
        }
      },
      {
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return json(
      { 
        success: false,
        error: 'Failed to upload file'
      }, 
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}