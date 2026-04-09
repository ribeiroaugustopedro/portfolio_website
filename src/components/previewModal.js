export function openPreviewModal(url, titleText) {
  // Check if modal already exists
  if (document.getElementById('project-preview-modal')) return;

  // Streamlit Specific Fix: Append ?embed=true to avoid redirect loops and improve embedding
  let embedUrl = url;
  if (url.includes('streamlit.app') && !url.includes('embed=true')) {
    embedUrl += (url.includes('?') ? '&' : '?') + 'embed=true';
  }

  const modal = document.createElement('div');
  modal.id = 'project-preview-modal';
  modal.className = 'preview-modal';
  
  // Modal Structure
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-container">
      <div class="modal-header">
        <div class="modal-title-group">
            <div class="modal-indicator"></div>
            <h3>${titleText}</h3>
        </div>
        <div class="modal-controls">
            <a href="${url}" target="_blank" class="modal-external-link" title="Open in new tab">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
            <button class="modal-close" id="close-project-modal">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
      </div>
      <div class="modal-body">
        <div class="modal-loader">
            <div class="loader-spinner"></div>
            <p>Initializing Secure Session...</p>
        </div>
        <iframe src="${embedUrl}" frameborder="0" allowfullscreen role="presentation" title="Project Preview"></iframe>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden'; // Prevent background scroll

  // Close Button Logic
  const closeBtn = modal.querySelector('#close-project-modal');
  const overlay = modal.querySelector('.modal-overlay');

  const closeModal = () => {
    modal.classList.add('closing');
    setTimeout(() => {
      document.body.removeChild(modal);
      document.body.style.overflow = '';
    }, 400);
  };

  closeBtn.onclick = closeModal;
  overlay.onclick = closeModal;

  // Iframe loading logic
  const iframe = modal.querySelector('iframe');
  const loader = modal.querySelector('.modal-loader');
  
  iframe.onload = () => {
    loader.classList.add('fade-out');
    setTimeout(() => loader.style.display = 'none', 500);
  };
}
