import prisma from '../db.server';

export async function getStoreCredentials(shop = 'badsheepyarn-gallery.myshopify.com') {
  console.log(shop, 'shop');
  try {
    const store = await prisma.session.findFirst({
      where: { 
        shop: shop,
      },
      select: { 
        shop: true,
        accessToken: true
      },
      orderBy: {
        expires: 'desc'
      }
    });
    
    if (!store) {
      throw new Error('Store not found');
    }
    
    return {
      domain: store.shop,
      accessToken: store.accessToken
    };
  } catch (error) {
    console.error('Error getting store credentials:', error);
    throw error;
  }
} 