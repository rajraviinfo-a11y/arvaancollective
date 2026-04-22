/* =============================================
   ADMIN PAGES CONTROLLER
   Manages storefront Pages CMS configurations
   ============================================= */
'use strict';
 
// Compatibility wrapper if showToast is called but not defined (using admin.js's adminToast)
function showToast(title, message, type = 'success') {
  if (window.adminToast) {
    window.adminToast(`${title}: ${message}`, type);
  } else {
    console.log(`Toast [${type}]: ${title} - ${message}`);
  }
}

let isHTMLMode = false;
let isCreateMode = false;

document.addEventListener('DOMContentLoaded', () => {
  renderPagesList();

  // Form submission handler
  document.getElementById('page-editor-form').addEventListener('submit', (e) => {
    e.preventDefault();
    savePageConfig();
  });
  
  // Sync RTE to textarea on input to keep things smooth
  document.getElementById('rich-editor-content').addEventListener('input', function() {
    if (!isHTMLMode) {
      document.getElementById('edit-page-content').value = this.innerHTML;
    }
  });

  document.getElementById('edit-page-content').addEventListener('input', function() {
    if (isHTMLMode) {
      document.getElementById('rich-editor-content').innerHTML = this.value;
    }
  });
});

function filterPagesList() {
  renderPagesList();
}

function renderPagesList() {
  const container = document.getElementById('pages-container');
  let pages = AdminStore.getPages();
  
  const searchStr = (document.getElementById('filter-search')?.value || '').toLowerCase();
  const statusStr = document.getElementById('filter-status')?.value || 'all';
  
  if (pages) {
    if (searchStr) {
      pages = pages.filter(p => 
        p.title.toLowerCase().includes(searchStr) || 
        p.slug.toLowerCase().includes(searchStr)
      );
    }
    if (statusStr === 'published') {
      pages = pages.filter(p => p.isActive !== false);
    } else if (statusStr === 'draft') {
      pages = pages.filter(p => p.isActive === false);
    }
  }
  
  if (!pages || pages.length === 0) {
    container.innerHTML = '<div class="empty-state">No matching pages found.</div>';
    return;
  }

  container.innerHTML = pages.map(page => {
    const isDraft = page.isActive === false;
    const badgeHTML = isDraft 
      ? `<span class="page-visibility-badge badge-draft interactive-badge" onclick="togglePageStatus('${page.slug}', true)" title="Click to Publish">
           <span class="badge-dot"></span>Draft
         </span>`
      : `<span class="page-visibility-badge badge-published interactive-badge" onclick="togglePageStatus('${page.slug}', false)" title="Click to Unpublish">
           <span class="badge-dot"></span>Published
         </span>`;
      
    const deleteBtn = !page.isSeed 
      ? `<button class="action-btn action-btn-delete" onclick="deletePage('${page.slug}')">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          Delete
        </button>`
      : '<div style="width:78px"></div>'; // Placeholder to keep alignment if no delete button

    return `
      <div class="page-card">
        <!-- Cell 1: Page Info -->
        <div>
          <div class="page-card-title">${page.title}</div>
          <div class="page-card-slug">store/pages.html?p=${page.slug}</div>
        </div>

        <!-- Cell 2: Status -->
        <div>
          ${badgeHTML}
        </div>

        <!-- Cell 3: Updated Date -->
        <div class="page-card-date">
          ${page.lastUpdated || 'Never'}
        </div>

        <!-- Cell 4: Actions -->
        <div class="page-card-actions">
          <button class="action-btn action-btn-view" onclick="window.open('../store/pages.html?p=${page.slug}', '_blank')" title="View on Storefront">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            View
          </button>
          ${deleteBtn}
          <button class="action-btn action-btn-edit" onclick="openEditor('${page.slug}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function openNewPageModal() {
  isCreateMode = true;
  document.getElementById('editor-page-title').textContent = 'Create New Page';
  document.getElementById('editor-page-slug').textContent = 'Fill in a URL slug below';
  document.getElementById('editor-page-icon') && (document.getElementById('editor-page-icon').textContent = '✨');

  // Show slug input inline
  document.getElementById('new-slug-wrap').style.display = 'inline';

  document.getElementById('edit-page-slug').value = '';
  document.getElementById('edit-page-title').value = '';
  document.getElementById('edit-page-content').value = '<p>Start typing your content here...</p>';
  document.getElementById('rich-editor-content').innerHTML = '<p>Start typing your content here...</p>';
  
  // Clear new fields
  document.getElementById('edit-page-hero').value = '';
  document.getElementById('edit-page-seo-title').value = '';
  document.getElementById('edit-page-seo-desc').value = '';

  document.getElementById('edit-page-visibility').checked = true; // default published
  document.getElementById('visibility-label').textContent = 'Published';
  document.getElementById('visibility-label').style.color = '#10b981';

  // Toggle View
  document.getElementById('pages-list-view').classList.add('hidden');
  document.getElementById('page-editor-view').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Reset to content tab
  const firstTab = document.querySelector('.editor-tab');
  if (firstTab) firstTab.click();
  
  if (isHTMLMode) toggleHTMLSource();

  // Disable preview button for new pages until saved
  document.getElementById('preview-page-btn').disabled = true;
  document.getElementById('preview-page-btn').title = 'Save page first to preview';
  
  // Reset hero preview
  if (typeof previewHeroImage === 'function') previewHeroImage('');
  if (typeof updateSerpPreview === 'function') updateSerpPreview();
}

function openEditor(slug) {
  isCreateMode = false;
  const page = AdminStore.getPage(slug);
  if (!page) {
    showToast('Error', 'Page not found.', 'error');
    return;
  }

  // Hide the slug-as-input for existing pages
  document.getElementById('new-slug-wrap').style.display = 'none';

  // Populate Editor
  document.getElementById('editor-page-title').textContent = `Edit: ${page.title}`;
  document.getElementById('editor-page-slug').textContent = `/${page.slug}.html`;
  
  document.getElementById('edit-page-slug').value = page.slug;
  document.getElementById('edit-page-title').value = page.title;
  document.getElementById('edit-page-content').value = page.content;
  document.getElementById('rich-editor-content').innerHTML = page.content;
  
  document.getElementById('edit-page-hero').value = page.heroImage || '';
  document.getElementById('edit-page-seo-title').value = page.seoTitle || '';
  document.getElementById('edit-page-seo-desc').value = page.seoDesc || '';

  const isPublished = page.isActive !== false;
  const visToggle = document.getElementById('edit-page-visibility');
  const visLabel  = document.getElementById('visibility-label');
  visToggle.checked = isPublished;
  visLabel.textContent = isPublished ? 'Published' : 'Draft';
  visLabel.style.color = isPublished ? '#10b981' : '#f59e0b';
  
  visToggle.onchange = function() {
    visLabel.textContent = this.checked ? 'Published' : 'Draft';
    visLabel.style.color = this.checked ? '#10b981' : '#f59e0b';
  };

  // View Switch
  document.getElementById('pages-list-view').classList.add('hidden');
  document.getElementById('page-editor-view').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Reset to Content tab on open
  const firstTab = document.querySelector('.editor-tab');
  if (firstTab) firstTab.click();

  if (isHTMLMode) toggleHTMLSource();
  
  document.getElementById('preview-page-btn').disabled = false;
  document.getElementById('preview-page-btn').title = '';

  // Sync hero preview & SERP if functions exist on page
  if (typeof previewHeroImage === 'function') previewHeroImage(page.heroImage || '');
  if (typeof updateSerpPreview === 'function') updateSerpPreview();
}

function closeEditor() {
  document.getElementById('pages-list-view').classList.remove('hidden');
  document.getElementById('page-editor-view').classList.add('hidden');
  if (typeof renderStatsBars === 'function') renderStatsBars();
}

function normalizeSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

function savePageConfig() {
  let slug = document.getElementById('edit-page-slug').value;
  const newTitle = document.getElementById('edit-page-title').value.trim();
  const isActive = document.getElementById('edit-page-visibility').checked;
  const heroImage = document.getElementById('edit-page-hero').value.trim();
  const seoTitle = document.getElementById('edit-page-seo-title').value.trim();
  const seoDesc = document.getElementById('edit-page-seo-desc').value.trim();
  
  // Get content depending on mode to ensure we have the latest
  const newContent = isHTMLMode 
    ? document.getElementById('edit-page-content').value.trim()
    : document.getElementById('rich-editor-content').innerHTML.trim();

  if (!newTitle || !newContent) {
    showToast('Error', 'Title and Content are required.', 'error');
    return;
  }

  const pages = AdminStore.getPages();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = new Date();
  const dateStr = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

  if (isCreateMode) {
    const rawSlug = document.getElementById('new-page-slug-input').value;
    slug = normalizeSlug(rawSlug);
    if (!slug) {
      showToast('Error', 'A valid URL slug is required.', 'error');
      return;
    }
    if (pages.some(p => p.slug === slug)) {
      showToast('Error', 'A page with this URL slug already exists.', 'error');
      return;
    }
    
    pages.push({
      slug: slug,
      title: newTitle,
      lastUpdated: dateStr,
      isActive: isActive,
      isSeed: false,
      content: newContent,
      heroImage: heroImage,
      seoTitle: seoTitle,
      seoDesc: seoDesc
    });
  } else {
    const index = pages.findIndex(p => p.slug === slug);
    if (index > -1) {
      pages[index].title = newTitle;
      pages[index].content = newContent;
      pages[index].isActive = isActive;
      pages[index].lastUpdated = dateStr;
      pages[index].heroImage = heroImage;
      pages[index].seoTitle = seoTitle;
      pages[index].seoDesc = seoDesc;
    } else {
      showToast('Error', 'Failed to find page configuration.', 'error');
      return;
    }
  }

  AdminStore.setPages(pages);
  showToast('Success', 'Page saved successfully!', 'success');
  closeEditor();
  renderPagesList(); 
}

function deletePage(slug) {
  console.log(`[CMS] Attempting delete for: ${slug}`);
  const page = AdminStore.getPage(slug);
  if (!page) {
    showToast('Error', 'Page not found.', 'error');
    return;
  }
  
  if (confirm(`Are you sure you want to permanently delete "${page.title}" (/${slug}.html)?\n\nThis cannot be undone.`)) {
    let pages = AdminStore.getPages();
    pages = pages.filter(p => p.slug !== slug);
    AdminStore.setPages(pages);
    showToast('Success', 'Page deleted successfully.', 'success');
    renderPagesList();
  }
}

function openLivePreview() {
  const slug = document.getElementById('edit-page-slug').value;
  if (!slug) return;
  // Use universal template pages.html to avoid 404s for new virtual pages
  window.open(`../store/pages.html?p=${slug}`, '_blank');
}

// ================= WYSIWYG Editor Actions =================
function formatDoc(cmd, value=null) {
  document.getElementById('rich-editor-content').focus();
  document.execCommand(cmd, false, value);
}

function addLink() {
  const url = prompt('Insert URL:');
  if (url) {
    formatDoc('createLink', url);
  }
}

function addImage() {
  const url = prompt('Enter Image URL to insert into content:');
  if (url) {
    // Focus first to ensure execCommand hits the right target
    const editor = document.getElementById('rich-editor-content');
    editor.focus();
    const success = document.execCommand('insertImage', false, url);
    if (!success) {
      // Fallback if execCommand fails (though rare in major browsers)
      const img = `<img src="${url}" alt="Image">`;
      document.execCommand('insertHTML', false, img);
    }
    console.log(`[CMS] Image inserted: ${url}`);
  }
}

function toggleHTMLSource() {
  isHTMLMode = !isHTMLMode;
  const wysiwygContainer = document.getElementById('wysiwyg-container');
  const htmlTextarea = document.getElementById('edit-page-content');
  const toggleBtn = document.getElementById('toggle-html-btn');
  
  if (isHTMLMode) {
    wysiwygContainer.classList.add('hidden');
    htmlTextarea.classList.remove('hidden');
    htmlTextarea.value = document.getElementById('rich-editor-content').innerHTML;
    toggleBtn.textContent = 'Show Visual Editor';
  } else {
    htmlTextarea.classList.add('hidden');
    wysiwygContainer.classList.remove('hidden');
    document.getElementById('rich-editor-content').innerHTML = htmlTextarea.value;
    toggleBtn.textContent = 'Show HTML Source';
  }
}

function togglePageStatus(slug, activate) {
  const pages = AdminStore.getPages();
  const idx = pages.findIndex(p => p.slug === slug);
  if (idx === -1) return;
  
  pages[idx].isActive = activate;
  pages[idx].lastUpdated = new Date().toLocaleString();
  
  AdminStore.setPages(pages);
  renderPagesList();
  if (typeof renderStatsBars === 'function') renderStatsBars();
  adminToast(`Page ${activate ? 'Published' : 'set to Draft'}`);
}

// Global exposure
window.togglePageStatus  = togglePageStatus;
window.deletePage        = deletePage;
window.openEditor        = openEditor;
window.closeEditor       = closeEditor;
window.openNewPageModal  = openNewPageModal;
window.savePageConfig    = savePageConfig;
window.filterPagesList   = filterPagesList;
window.openLivePreview   = openLivePreview;
window.toggleHTMLSource  = toggleHTMLSource;
window.formatDoc         = formatDoc;
window.addLink           = addLink;
window.addImage          = addImage;
