// Project Gallery JavaScript

// Global project data - use data passed from liquid template
var projectData = window.projectData || {};

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
            <div class="skeleton-product"></div>
            <div class="skeleton-button"></div>
          </div>
        </div>
      </div>
    `;
  }
  
  return skeletonHTML;
}

// Template for project card
function createProjectCard(project, index) {
  // Show permanent info overlay on some cards (like in screenshot)
  const showInfoOverlay = [-1].includes(index);
  
  // For demo purposes, ensure each project has multiple images
  if (!project.images || project.images.length === 0) {
    project.images = [project.product.imageUrl];
  }
  
  // If we have a single sample image, use product image as additional one for demo
  if (project.images.length === 1 && project.product.imageUrl) {
    project.images.push(project.product.imageUrl);
  }
  
  // Check if project has multiple images
  const hasMultipleImages = project.images.length > 1;
  
  return `
    <div class="masonry-grid-item" data-category="${project.tags.map(tag => tag.toLowerCase().replace(' ', '-')).join(' ')}">
      <div class="project-card">
        <div class="project-image" data-project-index="${index}">
          <img 
            src="${project.images[0]}" 
            alt="${project.projectName}"
            loading="lazy"
          >
          ${hasMultipleImages ? `
          <div class="multi-image-badge">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <rect x="2" y="2" width="13" height="13" rx="2" ry="2"></rect>
            </svg>
            ${project.images.length}
          </div>
          ` : ''}
          ${showInfoOverlay ? `
          <div class="project-info-overlay">
            <div class="project-info-title">${project.projectName}</div>
            <div class="project-info-creator">by ${getDisplayName(project)}</div>
            ${project.tags && project.tags.length > 0 ? `
              <div class="project-info-tags">
                ${project.tags.slice(0, 2).map(tag => `<span class="project-info-tag">${tag}</span>`).join('')}
                ${project.tags.length > 2 ? `<span class="project-info-tag">+${project.tags.length - 2}</span>` : ''}
              </div>
            ` : ''}
          </div>
          ` : ''}
        </div>
        <div class="project-content">
          <h3 class="project-title">${project.projectName}</h3>
          <div class="project-meta">by ${getDisplayName(project)}</div>
          <div class="project-tags">
            ${project.tags && project.tags.length > 0 ? 
              project.tags.map(tag => `<span class="project-tag">${tag}</span>`).join('') : ''}
          </div>

          ${project.projectDetails ? `<div class="project-details">${project.projectDetails}</div>` : ''}

          <div class="project-product">
            <a href="${project.product.url}" target="_blank">
              <div class="product-details">
                <div class="product-title">${project.product.title}</div>
                ${project.product.options && project.product.options.length > 0 ? 
                    `<div class="product-variant">${project.product.options[0][1]}</div>` : ''}
              </div>
            </a>
          </div>
          <button class="view-project-btn" onclick="openLightbox(${index}, 0)">View Project</button>
        </div>
      </div>
    </div>
  `;
}

// Helper function to get display name based on project settings
function getDisplayName(project) {
  return project.displayName; // Default to first name
}

// Render projects to the page with a masonry layout
function renderProjects() {
  const galleryGrid = document.getElementById('gallery-grid');
  
  // Show skeleton loading state first
  if (!projectData.initialized) {
    galleryGrid.innerHTML = createSkeletonCards();
    projectData.initialized = true;
    
    // Simulate loading delay (remove this in production)
    setTimeout(() => {
      // Get filtered and sorted projects
      const filteredProjects = getFilteredProjects();
      displayProjects(filteredProjects);
    }, 800); // Simulated loading time
    
    return;
  }
  
  // Get filtered and sorted projects
  const filteredProjects = getFilteredProjects();
  displayProjects(filteredProjects);
}

// Display filtered projects
function displayProjects(filteredProjects) {
  // Determine how many projects to display (respect batch size)
  const showCount = projectData.currentIndex + projectData.batchSize;
  const displayProjects = filteredProjects.slice(0, showCount);
  
  // Generate HTML for visible projects
  const galleryHTML = displayProjects.map((project, index) => createProjectCard(project, index)).join('');
  
  // Update the gallery with projects
  const galleryGrid = document.getElementById('gallery-grid');
  galleryGrid.innerHTML = galleryHTML;
  
  // Add no results message if needed
  if (filteredProjects.length === 0) {
    galleryGrid.innerHTML = `
      <div class="no-results">
        <p>No projects found matching your search criteria.</p>
        <p>Try a different search term or category.</p>
      </div>
    `;
  }
  
  // Show/hide load more button based on whether there are more projects to load
  const loadMoreButton = document.getElementById('load-more-btn');
  const loadLessButton = document.getElementById('load-less-btn');
  
  if (loadMoreButton) {
    if (showCount >= filteredProjects.length) {
      loadMoreButton.classList.add('hidden');
    } else {
      loadMoreButton.classList.remove('hidden');
    }
  }
  
  if (loadLessButton) {
    if (projectData.currentIndex > 0) {
      loadLessButton.classList.remove('hidden');
    } else {
      loadLessButton.classList.add('hidden');
    }
  }
  
  // Update category counts
  updateCategoryCounts();
}

// Update category filter button counts
function updateCategoryCounts() {
  const categoryButtons = document.querySelectorAll('.category-item');
  if (!categoryButtons.length) return;
  
  // Count projects per category
  const categoryCount = { all: projectData.projects.length };
  
  // Count projects in each category
  projectData.projects.forEach(project => {
    if (project.tags && Array.isArray(project.tags)) {
      project.tags.forEach(tag => {
        const categoryId = tag.toLowerCase().replace(' ', '-');
        categoryCount[categoryId] = (categoryCount[categoryId] || 0) + 1;
      });
    }
  });
  
  // Update the count display on category buttons
  categoryButtons.forEach(button => {
    const category = button.dataset.category;
    const countElement = button.querySelector('.category-count');
    
    if (countElement && categoryCount[category] !== undefined) {
      countElement.textContent = `(${categoryCount[category]})`;
    }
  });
}

// Sort projects based on the current sort option
function sortProjects(projects, sortOption) {
  if (!projects || !Array.isArray(projects)) return [];
  
  const sortedProjects = [...projects]; // Create a copy to avoid modifying the original
  
  // Apply sorting logic
  switch (sortOption) {
    case 'newest':
      sortedProjects.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      break;
    case 'oldest':
      sortedProjects.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
      break;
    case 'popular':
      sortedProjects.sort((a, b) => b.likes - a.likes);
      break;
    case 'az':
      sortedProjects.sort((a, b) => a.projectName.localeCompare(b.projectName));
      break;
    case 'za':
      sortedProjects.sort((a, b) => b.projectName.localeCompare(a.projectName));
      break;
    default:
      // Default to newest
      sortedProjects.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
  }
  
  return sortedProjects;
}

// Initialize the gallery when document is ready
document.addEventListener('DOMContentLoaded', function() {
  // Mark as not initialized to show skeleton first
  projectData.initialized = false;
  
  // Set the batch size from Shopify settings if available
  const batchSizeElement = document.getElementById('gallery-batch-size');
  if (batchSizeElement) {
    projectData.batchSize = parseInt(batchSizeElement.value) || 9;
  }
  
  // Setup category filters
  const categoryButtons = document.querySelectorAll('.category-item');
  categoryButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons
      categoryButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      this.classList.add('active');
      
      // Update current category and reset index
      projectData.currentCategory = this.dataset.category;
      projectData.currentIndex = 0;
      
      // Re-render projects
      renderProjects();
      
      // Track the selected category for analytics (optional)
      if (window.analytics && typeof window.analytics.track === 'function') {
        window.analytics.track('Category Filter Changed', {
          category: projectData.currentCategory
        });
      }
    });
  });
  
  // Setup sorting
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    // Set initial sort option from select
    projectData.currentSortOption = sortSelect.value;
    
    // Listen for changes
    sortSelect.addEventListener('change', function() {
      projectData.currentSortOption = this.value;
      renderProjects();
    });
  }
  
  // Setup search
  const searchInput = document.getElementById('gallery-search');
  const searchClear = document.getElementById('search-clear');
  
  if (searchInput) {
    // Debounce search to avoid too many redraws
    let searchTimeout;
    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      
      searchTimeout = setTimeout(() => {
        handleSearch(this.value.toLowerCase().trim());
      }, 300);
    });
    
    // Clear search
    if (searchClear) {
      searchClear.addEventListener('click', function() {
        searchInput.value = '';
        handleSearch('');
      });
    }
  }
  
  // Setup load more/less functionality
  const loadMoreBtn = document.getElementById('load-more-btn');
  const loadLessBtn = document.getElementById('load-less-btn');
  
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function() {
      projectData.currentIndex += projectData.batchSize;
      renderProjects();
      
      // Scroll to newly loaded projects
      window.scrollBy({
        top: 300,
        behavior: 'smooth'
      });
    });
  }
  
  if (loadLessBtn) {
    loadLessBtn.addEventListener('click', function() {
      projectData.currentIndex = 0;
      renderProjects();
      
      // Scroll to top of gallery
      document.querySelector('.project-gallery').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  }
  
  // Load initial project data
  renderProjects();
  
  // Setup lightbox gallery
  setupLightbox();
});

// Handle search functionality
function handleSearch(searchTerm) {
  // This function may be overridden by the API-based search in the liquid template
  // Check if we're using API filtering before proceeding with client-side search
  if (projectData.apiFiltering) {
    // This is now handled in the template script
    return;
  }
  
  // Client-side search (fallback)
  projectData.searchTerm = searchTerm;
  projectData.currentIndex = 0; // Reset to first page of results
  renderProjects();
}

// Helper function to get currently filtered projects
function getFilteredProjects() {
  // When using API filtering, all filtering is already done by the API
  if (projectData.apiFiltering) {
    return projectData.projects;
  }
  
  // Client-side filtering (fallback)
  // Filter by category
  let filteredProjects = projectData.projects;
  
  // Apply category filter if not 'all'
  if (projectData.currentCategory !== 'all') {
    filteredProjects = filteredProjects.filter(project => 
      project.tags && Array.isArray(project.tags) && 
      project.tags.some(tag => 
        tag.toLowerCase().replace(' ', '-') === projectData.currentCategory
      )
    );
  }
  
  // Filter by search term if it exists - ONLY match project name and product title
  const searchTerm = projectData.searchTerm || '';
  if (searchTerm) {
    filteredProjects = filteredProjects.filter(project => {
      // Search ONLY in project name and product title
      const projectNameMatch = project.projectName && 
        project.projectName.toLowerCase().includes(searchTerm);
      
      const productMatch = project.product && project.product.title && 
        project.product.title.toLowerCase().includes(searchTerm);
      
      return projectNameMatch || productMatch;
    });
  }
  
  // Sort the filtered projects
  return sortProjects(filteredProjects, projectData.currentSortOption);
}

// Lightbox gallery functionality
function setupLightbox() {
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const loadingSpinner = document.getElementById('lightbox-spinner');
  const closeButton = document.getElementById('lightbox-close');
  const prevButton = document.getElementById('lightbox-prev');
  const nextButton = document.getElementById('lightbox-next');
  const prevProjectButton = document.getElementById('prev-project-btn');
  const nextProjectButton = document.getElementById('next-project-btn');
  const thumbnailContainer = document.getElementById('thumbnail-container');
  const imageCounter = document.getElementById('image-counter');
  const expandButton = document.getElementById('expand-image-btn');
  const expandedView = document.getElementById('expanded-view');
  const expandedImage = document.getElementById('expanded-image');
  const expandedClose = document.getElementById('expanded-close');
  
  let currentProjectIndex = 0;
  let currentImageIndex = 0;
  let imageCache = {}; // Cache for preloaded images
  
  // Handle clicks on project images to open lightbox directly without thumbnails
  document.addEventListener('click', function(event) {
    const projectImageContainer = event.target.closest('.project-image');
    if (projectImageContainer) {
      event.preventDefault();
      currentProjectIndex = parseInt(projectImageContainer.dataset.projectIndex);
      currentImageIndex = 0; // Reset to first image of project
      
      openLightbox(currentProjectIndex, currentImageIndex);
      
      // Preload rest of the project images
      const project = getFilteredProjects()[currentProjectIndex];
      if (project && project.images && project.images.length > 1) {
        preloadProjectImages(project);
      }
    }
  });

  // Full screen image view functionality
  expandButton.addEventListener('click', function() {
    const currentSrc = lightboxImage.src;
    expandedImage.src = currentSrc;
    expandedImage.alt = lightboxImage.alt;
    
    // Reset any existing styles first
    expandedImage.removeAttribute('style');
    
    // Apply fresh inline styles for proper expanded image display
    expandedImage.style.maxWidth = "100%";
    expandedImage.style.maxHeight = "calc(100vh - 80px)";
    expandedImage.style.height = "auto";
    expandedImage.style.objectFit = "contain";
    expandedImage.style.margin = "0 auto";
    expandedImage.style.display = "block";
    
    expandedView.classList.add('active');
  });

  expandedClose.addEventListener('click', function() {
    expandedView.classList.remove('active');
  });

  // Close expanded view when clicking outside the image
  expandedView.addEventListener('click', function(event) {
    if (event.target === expandedView) {
      expandedView.classList.remove('active');
    }
  });

  // Close expanded view with Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && expandedView.classList.contains('active')) {
      expandedView.classList.remove('active');
    }
  });
  
  // Initialize thumbnails of all projects
  function initThumbnails() {
    const filteredProjects = getFilteredProjects();
    let thumbnailsHTML = '';
    
    filteredProjects.forEach((project, index) => {
      // Ensure each project has at least one image
      const thumbnailImage = project.images && project.images.length > 0 
        ? project.images[0] 
        : project.product.imageUrl;
      
      const isActive = index === currentProjectIndex ? 'active' : '';
      
      thumbnailsHTML += `
        <div class="thumbnail ${isActive}" data-project-index="${index}">
          <img src="${thumbnailImage}" alt="${project.projectName}" loading="lazy">
        </div>
      `;
    });
    
    thumbnailContainer.innerHTML = thumbnailsHTML;
    
    // Add event listeners to thumbnails
    document.querySelectorAll('.thumbnail').forEach(thumb => {
      thumb.addEventListener('click', function() {
        const projectIndex = parseInt(this.dataset.projectIndex);
        navigateToProject(projectIndex);
      });
    });
    
    // Scroll to center the active thumbnail
    const activeThumbnail = thumbnailContainer.querySelector('.thumbnail.active');
    if (activeThumbnail) {
      activeThumbnail.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }
  
  // Update active thumbnail when changing projects
  function updateActiveThumbnail() {
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach((thumb, index) => {
      if (parseInt(thumb.dataset.projectIndex) === currentProjectIndex) {
        thumb.classList.add('active');
      } else {
        thumb.classList.remove('active');
      }
    });
    
    // Scroll to center the active thumbnail
    const activeThumbnail = thumbnailContainer.querySelector('.thumbnail.active');
    if (activeThumbnail) {
      activeThumbnail.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }
  
  // Preload all images for a project
  function preloadProjectImages(project) {
    if (!project.images) return;
    
    project.images.forEach((imageUrl, index) => {
      // Skip first image (already loaded) and already cached images
      if (index === currentImageIndex || imageCache[imageUrl]) return;
      
      const img = new Image();
      img.src = imageUrl;
      img.onload = function() {
        imageCache[imageUrl] = true;
      };
    });
  }
  
  // Close lightbox - enhanced with proper focus management
  closeButton.addEventListener('click', function(event) {
    event.preventDefault(); // Prevent any default action
    event.stopPropagation(); // Prevent event bubbling
    closeLightbox();
  });
  
  // Close lightbox when clicking outside the image
  lightbox.addEventListener('click', function(event) {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });
  
  // Navigate to previous image (within same project)
  prevButton.addEventListener('click', function() {
    navigateImages(-1);
  });
  
  // Navigate to next image (within same project)
  nextButton.addEventListener('click', function() {
    navigateImages(1);
  });
  
  // Navigate to previous project
  prevProjectButton.addEventListener('click', function() {
    navigateProjects(-1);
  });
  
  // Navigate to next project
  nextProjectButton.addEventListener('click', function() {
    navigateProjects(1);
  });
  
  // Direct navigation to specific project
  function navigateToProject(projectIndex) {
    currentProjectIndex = projectIndex;
    currentImageIndex = 0; // Reset to first image of new project
    openLightbox(currentProjectIndex, currentImageIndex);
    updateActiveThumbnail();
  }
  
  // Keyboard navigation
  document.addEventListener('keydown', function(event) {
    if (!lightbox.classList.contains('active')) return;
    
    if (event.key === 'Escape') {
      closeLightbox();
    } else if (event.key === 'ArrowLeft') {
      navigateImages(-1);
    } else if (event.key === 'ArrowRight') {
      navigateImages(1);
    } else if (event.key === 'ArrowUp') {
      navigateProjects(-1);
    } else if (event.key === 'ArrowDown') {
      navigateProjects(1);
    }
  });
  
  // Touch swipe for mobile devices
  let touchStartX = 0;
  let touchEndX = 0;
  let touchStartY = 0;
  let touchEndY = 0;
  
  lightbox.addEventListener('touchstart', function(event) {
    touchStartX = event.changedTouches[0].screenX;
    touchStartY = event.changedTouches[0].screenY;
  });
  
  lightbox.addEventListener('touchend', function(event) {
    touchEndX = event.changedTouches[0].screenX;
    touchEndY = event.changedTouches[0].screenY;
    handleSwipe();
  });
  
  function handleSwipe() {
    const minSwipeDistance = 50;
    const horizontalDistance = Math.abs(touchEndX - touchStartX);
    const verticalDistance = Math.abs(touchEndY - touchStartY);
    
    // If horizontal swipe is more prominent than vertical
    if (horizontalDistance > verticalDistance) {
      if (touchEndX < touchStartX - minSwipeDistance) {
        // Swiped left - show next image
        navigateImages(1);
      } else if (touchEndX > touchStartX + minSwipeDistance) {
        // Swiped right - show previous image
        navigateImages(-1);
      }
    } else if (verticalDistance > horizontalDistance) {
      // If vertical swipe is more prominent than horizontal
      if (touchEndY < touchStartY - minSwipeDistance) {
        // Swiped up - show next project
        navigateProjects(1);
      } else if (touchEndY > touchStartY + minSwipeDistance) {
        // Swiped down - show previous project
        navigateProjects(-1);
      }
    }
  }
  
  // Function to navigate between images within a project
  function navigateImages(direction) {
    const filteredProjects = getFilteredProjects();
    const project = filteredProjects[currentProjectIndex];
    
    if (project && project.images && project.images.length > 1) {
      // If project has multiple images, navigate between them
      currentImageIndex = (currentImageIndex + direction + project.images.length) % project.images.length;
      openLightbox(currentProjectIndex, currentImageIndex);
    } else {
      // If project has only one image, go to next/previous project
      navigateProjects(direction);
    }
  }
  
  // Function to navigate between projects
  function navigateProjects(direction) {
    const filteredProjects = getFilteredProjects();
    currentProjectIndex = (currentProjectIndex + direction + filteredProjects.length) % filteredProjects.length;
    currentImageIndex = 0; // Reset to first image of new project
    openLightbox(currentProjectIndex, currentImageIndex);
    
    // Preload images of the new project
    const newProject = filteredProjects[currentProjectIndex];
    if (newProject && newProject.images && newProject.images.length > 1) {
      preloadProjectImages(newProject);
    }
  }
  
  function openLightbox(projectIndex, imageIndex) {
    const filteredProjects = getFilteredProjects();
    const project = filteredProjects[projectIndex];
    if (!project) return;
    
    // For demo purposes, let's ensure each project has at least one image
    if (!project.images || project.images.length === 0) {
      project.images = [project.product.imageUrl];
    }
    
    // If we have multiple sample images for a project, simulate it here
    // This is just for demonstration - in a real scenario, projects would have multiple images
    if (project.images.length === 1 && project.product.imageUrl) {
      // Add product image as a second image for demonstration
      project.images.push(project.product.imageUrl);
    }
    
    // Ensure image index is valid
    imageIndex = (imageIndex + project.images.length) % project.images.length;
    currentImageIndex = imageIndex;
    
    // Get current image URL
    const imageUrl = project.images[imageIndex];
    
    // Update image counter display format: "Image X/Y - Project Z/W"
    imageCounter.textContent = `Project ${projectIndex + 1}/${filteredProjects.length} - Image ${imageIndex + 1}/${project.images.length}`;
    
    // Add fade-out class for transition and show loading spinner
    lightboxImage.classList.add('fade-out');
    loadingSpinner.classList.add('active');
    
    // Populate the detailed project information panel
    const detailsContainer = document.getElementById('lightbox-details');
    detailsContainer.innerHTML = generateProjectDetails(project);
    
    // Set caption with image counter and additional navigation hints
    lightboxCaption.textContent = `Image ${imageIndex + 1} of ${project.images.length}`;
    if (project.images.length > 1) {
      lightboxCaption.textContent += " - Use left/right arrows or swipe to view more images";
    }
    
    // Reset any inline styles on the lightbox image
    lightboxImage.removeAttribute('style');
    
    // Check if image is cached, if not, load it
    if (imageCache[imageUrl]) {
      // Image is already cached, load immediately
      displayImage(imageUrl, project.projectName);
    } else {
      // Image is not cached, load it first
      const img = new Image();
      img.src = imageUrl;
      img.onload = function() {
        imageCache[imageUrl] = true;
        displayImage(imageUrl, project.projectName);
      };
      img.onerror = function() {
        // If image fails to load, remove spinner and show error
        loadingSpinner.classList.remove('active');
        lightboxImage.classList.remove('fade-out');
        lightboxCaption.textContent = `Error loading image for ${project.projectName}`;
      };
    }
    
    // Show the lightbox if it's not already visible
    if (!lightbox.classList.contains('active')) {
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent scrolling while lightbox is open
    }
  }
  
  function displayImage(imageUrl, altText) {
    // Small timeout to ensure smooth transition even for cached images
    setTimeout(() => {
      // Set the image source to current image in the project
      lightboxImage.src = imageUrl;
      lightboxImage.alt = altText;
      
      // Reset any inline styles that might be interfering
      lightboxImage.removeAttribute('style');
      
      // Apply fresh inline styles for proper image display
      lightboxImage.style.maxWidth = "100%";
      lightboxImage.style.maxHeight = "calc(100vh - 180px)";
      lightboxImage.style.height = "auto";
      lightboxImage.style.objectFit = "contain";
      lightboxImage.style.margin = "0 auto";
      lightboxImage.style.display = "block";
      
      // Hide loading spinner
      loadingSpinner.classList.remove('active');
      
      // Remove fade-out class to fade in the new image
      lightboxImage.classList.remove('fade-out');
    }, 300);
  }
  
  function closeLightbox() {
    // Apply a closing animation
    lightbox.style.opacity = '0';
    
    // After animation, hide the lightbox completely and reset scrolling
    setTimeout(() => {
      lightbox.classList.remove('active');
      lightbox.style.opacity = '1'; // Reset opacity for next opening
      document.body.style.overflow = ''; // Restore scrolling
    }, 200);
  }
}

// New function to generate the detailed project information HTML with enhanced styling
function generateProjectDetails(project) {
  // Format date nicely if needed
  const date = new Date(project.dateAdded);
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  }).format(date);
  
  // Get display name based on project settings
  let creatorName = project.firstName || '';
  if (project.lastName) {
    creatorName += ' ' + project.lastName;
  }
  
  let html = `
    <h1 class="project-title">${project.projectName}</h1>
    <h2 class="project-creator">by ${creatorName}</h2>
  `;
  
  // Add yarn information (similar to reference image)
  if (project.product) {
    html += `
      <div class="details-section">
        <div class="yarn-item">
          <div class="yarn-name">Yarn: ${project.product.title}</div>
          ${project.product.options && project.product.options.length > 0 ? `
            <div class="yarn-type">${project.product.options.map(option => `${option[0]}: ${option[1]}`).join(', ')}</div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  // Add pattern information if available (similar to reference image)
  if (project.patternName) {
    html += `
      <div class="details-section">
        <div class="info-divider"></div>
        <div class="pattern-name">Pattern: ${project.patternName}</div>
        ${project.designerName ? `
          <div class="pattern-designer">by ${project.designerName}</div>
          <a href="#" class="pattern-link">View Pattern</a>
        ` : ''}
      </div>
    `;
  }
  
  // Add categories/tags section (similar to reference image)
  if (project.tags && project.tags.length > 0) {
    html += `
      <div class="details-section">
        <div class="info-divider"></div>
        <div class="category-tags">
          ${project.tags.map(tag => `
            <span class="category-tag">${tag}</span>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  // Add social media if available
  if (project.socialMedia) {
    html += `
      <div class="details-section">
        <div class="info-divider"></div>
        <div class="social-link">${project.socialMedia}</div>
      </div>
    `;
  }
  
  // Add date added
  html += `
    <div class="details-section">
      <div class="info-divider"></div>
      <div>Added on ${formattedDate}</div>
    </div>
  `;
  
  return html;
}
