import {
  json,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData,
} from "@remix-run/node";

import { s3UploadHandler } from "../utils/s3.server";

export const action = async ({ request }) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
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
      return json({
        success: false,
        error: "Something went wrong while uploading"
      }, { status: 400 });
    }

    return json({
      success: true,
      data: {
        imageUrl: imgSrc,
        description: imgDesc
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return json({ 
      success: false,
      error: 'Failed to upload file'
    }, { status: 500 });
  }
}