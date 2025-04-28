import { getStoreCredentials } from './storeUtils';

const SEARCH_PRODUCTS_QUERY = `
  query searchProducts($query: String!) {
    products(first: 10, query: $query) {
      edges {
        node {
          id
          title
          handle
          featuredImage {
            url
            altText
          }
          options {
            name
            values
          }
          variants(first: 1) {
            edges {
              node {
                price
                compareAtPrice
              }
            }
          }
        }
      }
    }
  }
`;

export async function searchProducts(query,shop) {
  try {
    const { domain, accessToken } = await getStoreCredentials(shop);
    
    const response = await fetch(`https://${domain}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({
        query: SEARCH_PRODUCTS_QUERY,
        variables: { query },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      console.error('GraphQL Errors:', result.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    if (!result.data?.products?.edges) {
      throw new Error('Invalid response structure from Shopify API');
    }

    const products = result.data.products.edges.map(edge => {
      const node = edge.node;
      return {
        id: node.id,
        title: node.title,
        handle: node.handle,
        image: node.featuredImage?.url || null,
        imageAlt: node.featuredImage?.altText || null,
        options: node.options,
        price: node.variants.edges[0]?.node.price || '0.00',
        compareAtPrice: node.variants.edges[0]?.node.compareAtPrice || null
      };
    });

    return { products, domain };
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
}