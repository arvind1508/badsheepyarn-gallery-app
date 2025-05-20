// Product Projects Gallery JavaScript

// Global product project data
var productProjectData = window.productProjectData || {};

// Skeleton loading state - show before content loads
function createSkeletonCards(count = 6) {
  let skeletonHTML = '';
  
  for (let i = 0; i < count; i++) {
    skeletonHTML += `
      <div class="masonry-grid-item skeleton-item">
        <div class="project-card skeleton">
          <div class="skeleton-image"></div>
          <div class="skeleton-content">
            <div class="skeleton-title"></div>
            <div class="skeleton-meta"></div>
            <div class="skeleton-tags">
              <span class="skeleton-tag"></span>
              <span class="skeleton-tag"></span>
            </div>
            <div class="skeleton-button"></div>
          </div>
        </div>
      </div>
    `;
  }
  
  return skeletonHTML;
}

// Template for project card
function createProjectCard(project) {
  // Get the first image or fallback
  const imageUrl = project.images && project.images.length > 0 
    ? project.images[0] 
    : 'https://via.placeholder.com/400x300?text=No+Image';
  
  // Format creator's name based on preference
  let creatorName = 'Anonymous';
  if (project.nameDisplay === 'first_name' && project.firstName) {
    creatorName = project.firstName;
  } else if (project.nameDisplay === 'full_name' && (project.firstName || project.lastName)) {
    creatorName = `${project.firstName || ''} ${project.lastName || ''}`.trim();
  } else if (project.nameDisplay === 'username' && project.socialMedia) {
    creatorName = project.socialMedia;
  }
  
  return `
    <div class="project-card">
      <div class="project-image">
        <img 
          src="${imageUrl}" 
          alt="${project.projectName}" 
          loading="lazy"
          width="400"
          height="300"
        >
      </div>
      <div class="project-info-overlay">
        <div class="project-info-title">${project.projectName}</div>
        <div class="project-info-creator">by ${creatorName}</div>
        <div class="project-info-tags">
          ${project.tags.slice(0, 3).map(tag => `<span class="project-info-tag">${tag}</span>`).join('')}
        </div>
      </div>
      <div class="project-content">
        <h3 class="project-title">${project.projectName}</h3>
        <p class="project-meta">by ${creatorName}</p>
        <div class="project-tags">
          ${project.tags.map(tag => `<span class="project-tag">${tag}</span>`).join('')}
        </div>
        ${project.patternName ? `
          <p class="project-meta">Pattern: ${project.patternName}</p>
          ${project.designerName ? `<p class="project-meta">Designer: ${project.designerName}</p>` : ''}
          ${project.patternLink ? `<a href="${project.patternLink}" target="_blank" class="view-project-btn">View Pattern</a>` : ''}
        ` : ''}
      </div>
    </div>
  `;
}

// Render projects to the page
function renderProductProjects() {
  const galleryGrid = document.getElementById('product-gallery-grid');
  if (!galleryGrid) return;
  
  // Show skeleton loading if not initialized
  if (!productProjectData.initialized) {
    galleryGrid.innerHTML = createSkeletonCards();
    productProjectData.initialized = true;
    return;
  }
  
  // Clear loading state
  galleryGrid.innerHTML = ''; 
  
  const { projects, currentIndex, batchSize } = productProjectData;
  
  // Get the current batch
  const currentBatch = projects.slice(0, currentIndex + batchSize);
  
  // If no projects, show message
  if (currentBatch.length === 0) {
    showNoProjects();
    return;
  }
  
  // Generate the HTML for the projects
  currentBatch.forEach(project => {
    // Create a grid item for each project
    const gridItem = document.createElement('div');
    gridItem.className = 'masonry-grid-item';
    
    // Add the project card HTML
    gridItem.innerHTML = createProjectCard(project);
    
    // Add to gallery
    galleryGrid.appendChild(gridItem);
  });
  
  // Show/hide the load more button
  const loadMoreBtn = document.getElementById('load-more-btn');
  if (loadMoreBtn) {
    if (currentBatch.length >= projects.length) {
      loadMoreBtn.classList.add('hidden');
    } else {
      loadMoreBtn.classList.remove('hidden');
    }
  }
}

// Show no projects message
function showNoProjects(message) {
  const galleryGrid = document.getElementById('product-gallery-grid');
  if (galleryGrid) {
    galleryGrid.classList.add('empty');
    
    galleryGrid.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">🧶</div>
        <p>${message || 'No projects yet for this product'}</p>
        <p>Be the first to share your creation!</p>
        <a href="${productProjectData.submitButtonLink || '#'}" class="view-project-btn">Submit Your Project</a>
      </div>
    `;
  }
  
  // Hide load more button
  const loadMoreBtn = document.getElementById('load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.classList.add('hidden');
  }
}

// Fetch the projects from the API
async function fetchProductProjects() {
  return new Promise(async (resolve, reject) => {
    try {
      const shopDomain = productProjectData.shopDomain;
      const productHandle = productProjectData.currentProductHandle;
      
      if (!productHandle) {
        console.error('Product handle not found');
        showNoProjects();
        resolve();
        return;
      }
      
      let url = `${productProjectData.apiUrl}?shop=${shopDomain}&productHandle=${encodeURIComponent(productHandle)}&perPage=100`;
      
      console.log('Fetching projects for product:', productHandle);
      
      // Show loading indicator
      const galleryGrid = document.getElementById('product-gallery-grid');
      if (galleryGrid) {
        galleryGrid.innerHTML = `
          <div class="loading-indicator" style="text-align: center; padding: 2rem;">
            <div class="loading-spinner active" style="display: inline-block;"></div>
            <p>Loading projects...</p>
          </div>
        `;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      
      if (!data.submissions || data.submissions.length === 0) {
        showNoProjects();
        resolve();
        return;
      }
      
      // Format the API data
      const projects = (data.submissions || []).map(submission => {
        // Process categories - either use the array or create from the string
        let categories = [];
        if (submission.categories && Array.isArray(submission.categories)) {
          categories = submission.categories.map(cat => {
            if (cat === cat.toUpperCase()) {
              return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
            }
            return cat;
          });
        } else if (submission.category) {
          categories = submission.category.split(',').map(cat => {
            const trimmed = cat.trim();
            if (trimmed === trimmed.toUpperCase()) {
              return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
            }
            return trimmed;
          });
        }
        
        return {
          projectName: submission.projectName || 'Untitled Project',
          firstName: submission.firstName || '',
          lastName: submission.lastName || '',
          nameDisplay: submission.nameDisplayPreference || 'anonymous',
          socialMedia: submission.socialMediaHandle || '',
          patternName: submission.patternName || '',
          designerName: submission.designerName || '',
          patternLink: submission.patternLink || '',
          displayName: submission.displayName || '',
          tags: categories.length > 0 ? categories : ['Other'],
          images: submission.images.map(img => img.url) || [],
          dateAdded: submission.approvedAt || submission.createdAt
        };
      });
      
      productProjectData.projects = projects;
      productProjectData.initialized = true;
      
      console.log('Projects loaded:', projects.length);
      
      // Render the projects
      renderProductProjects();
      
      // Resolve the promise when done
      resolve();
    } catch (error) {
      console.error('Error fetching projects:', error);
      showNoProjects('Failed to load projects. Please try again later.');
      reject(error);
    }
  });
}

// Initialize the gallery when document is ready
document.addEventListener('DOMContentLoaded', function() {
  // Get product handle from hidden input
  const productHandleInput = document.getElementById('current-product-handle');
  const batchSizeInput = document.getElementById('gallery-batch-size');
  const submitButtonLink = document.querySelector('.submit-project-wrapper a')?.getAttribute('href') || '';
  
  // Initialize the product project data
  productProjectData = {
    projects: [],
    currentProductHandle: productHandleInput?.value,
    batchSize: parseInt(batchSizeInput?.value || '6'),
    currentIndex: 0,
    apiUrl: 'https://badsheepyarn-gallery-app.vercel.app/api/public/submissions',
    shopDomain: window.Shopify?.shop || document.querySelector('meta[name="shopify-shop-id"]')?.content || '',
    submitButtonLink: submitButtonLink,
    initialized: false
  };
  
  // Set up load more button
  const loadMoreBtn = document.getElementById('load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function() {
      productProjectData.currentIndex += productProjectData.batchSize;
      renderProductProjects();
      
      // Scroll to newly loaded projects
      window.scrollBy({
        top: 300,
        behavior: 'smooth'
      });
    });
  }
  
  // Fetch projects
  fetchProductProjects();
}); 