// Photo Manager Module
class PhotoManager {
  constructor() {
    this.photos = [];
    this.mainPhotoId = null;
    this.currentEditingPhoto = null;
    this.cropBox = null;
    this.cropContainer = null;
    this.isResizing = false;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.startWidth = 0;
    this.startHeight = 0;
    this.startLeft = 0;
    this.startTop = 0;
    this.activeHandle = null;
    this.imageWidth = 0;
    this.imageHeight = 0;
    this.apiConfig = null; // Will be loaded from server
  }

  async init() {
    if (!window.authManager?.sessionId) {
      console.warn('[PHOTO MANAGER] No session ID found, skipping initialization');
      return;
    }

    // Load API configuration from server
    await this.loadApiConfig();
    await this.loadExistingPhotos();
    this.renderPhotoGallery();
    this.attachEventListeners();
  }

  async loadApiConfig() {
    try {
      const response = await fetch('/api/get-api-key');
      this.apiConfig = await response.json();
      console.log('[PHOTO MANAGER] API config loaded securely');
    } catch (error) {
      console.error('[PHOTO MANAGER] Failed to load API config:', error);
      // Fallback to hardcoded values for development
      this.apiConfig = {
        apiKey: 'f512a388aa942760c3200a4ef8fb523a61s',
        baseUrl: 'https://dev2018.de5a7.com'
      };
    }
  }

  attachEventListeners() {
    // Crop modal events
    const closeBtn = document.getElementById('closePhotoCropModal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeCropModal());
    }

    const validateBtn = document.getElementById('validatePhotoBtn');
    if (validateBtn) {
      validateBtn.addEventListener('click', () => this.validatePhoto());
    }

    const deleteBtn = document.getElementById('deletePhotoBtn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => this.deleteCurrentPhoto());
    }

    // Modal overlay close
    const modalOverlay = document.querySelector('.photo-crop-modal .modal-overlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', () => this.closeCropModal());
    }

    // Initialize crop box events
    this.initializeCropBox();
  }

  async loadExistingPhotos() {
    const sessionId = window.authManager?.sessionId;
    console.log('[PHOTO MANAGER] Loading existing photos...');
    console.log('[PHOTO MANAGER] Session ID:', sessionId);
    
    if (!sessionId) {
      console.log('[PHOTO MANAGER] No session ID, skipping photo load');
      return;
    }

    try {
      // Get full list of user photos - direct API call (no proxy)
      const apiUrl = `${this.apiConfig.baseUrl}/index_api/user_edit_photos?session_id=${sessionId}&api_key=${this.apiConfig.apiKey}`;
      console.log('[PHOTO MANAGER] API URL:', apiUrl);
      const resp = await fetch(apiUrl, { method: 'POST' });
      const data = await resp.json();
      console.log('[PHOTO MANAGER] Full user_edit_photos response:', JSON.stringify(data, null, 2));
      
      let photosArr = [];
      
      // API returns photos as object with numbered keys, not array
      if (data.photos && typeof data.photos === 'object' && !Array.isArray(data.photos)) {
        // Convert object to array
        photosArr = Object.values(data.photos).filter(p => p && typeof p === 'object');
      } else if (data.photos && Array.isArray(data.photos)) {
        photosArr = data.photos;
      } else if (data.success && data.data && Array.isArray(data.data)) {
        photosArr = data.data;
      } else if (data.success && data.data && Array.isArray(data.data.result)) {
        photosArr = data.data.result;
      } else if (data.data && typeof data.data === 'object') {
        // Sometimes API returns object with numbered keys
        photosArr = Object.values(data.data).filter(p => p && typeof p === 'object');
      }
      
      console.log('[PHOTO MANAGER] Raw photos object:', data.photos);
      console.log('[PHOTO MANAGER] Photos object type:', typeof data.photos);
      console.log('[PHOTO MANAGER] Photos object keys:', data.photos ? Object.keys(data.photos) : 'none');
      console.log('[PHOTO MANAGER] Found photos array:', photosArr);
      console.log('[PHOTO MANAGER] Photos array length:', photosArr.length);
      
      if (photosArr.length > 0) {
        // Filter out invalid photos (num should be valid)
        photosArr = photosArr.filter(p => {
          const photoNum = Number(p.num || p.id_photo || p.id || 0);
          return photoNum >= 0; // Allow 0 and positive numbers
        });
        
        this.photos = photosArr.map((p, idx) => ({
          id: p.num || p.id_photo || p.id || `server-${idx}`,
          serverId: p.num || p.id_photo || p.id,
          photoNum: p.num, // For API calls - this is the correct field for deletion
          url: p.url_big || p.url_middle || p.url_small || p.sq_430 || p.normal,
          urlMiddle: p.url_middle,
          urlSmall: p.url_small,
          previewUrl: null,
          name: p.name || `photo_${idx}.jpg`,
          isMain: p.is_main === 1 || p.principale === 1,
          accepted: p.accepted !== undefined ? p.accepted : 1, // Default to accepted if not specified
          isPrivate: p.is_private || 0,
          date: p.date
        }));

        // Find main photo
        const main = this.photos.find(ph => ph.isMain) || this.photos[0];
        if (main) {
          this.mainPhotoId = main.id;
          this.updateProfileAvatar(main.url);
        }
      }
      
      if (!photosArr.length) {
        console.warn('[PHOTO MANAGER] user_edit_photos empty, fallback to /user');
        const userDataString = localStorage.getItem('lavrilo_user');
        if (!userDataString) return;
        const userId = JSON.parse(userDataString).id;
        const apiUrl2 = `/api/spice-multi-test?endpoint=/index_api/user&method=POST&session_id=${sessionId}&id=${userId}&get_picture_430=1`;
        const r2 = await fetch(apiUrl2);
        const d2 = await r2.json();
        
        if (d2.success && d2.data) {
          const photos = d2.data.photos_v2 || d2.data.photos || [];
          this.photos = photos.filter(p => p.id > 0).map((p, idx) => ({
            id: p.id || `server-${idx}`,
            serverId: p.id,
            photoNum: p.num || p.id_photo || p.id || 0, // Важно для удаления!
            url: p.sq_430 || p.normal || p.url_big,
            previewUrl: null,
            name: `photo_${idx}.jpg`,
            isMain: p.is_main === 1 || idx === 0,
            accepted: p.accepted || 0
          }));

          if (this.photos.length > 0) {
            this.mainPhotoId = this.photos[0].id;
            this.updateProfileAvatar(this.photos[0].url);
          }
        }
      }
    } catch (error) {
      console.error('[PHOTO MANAGER] Error loading photos:', error);
    }
  }

  updateProfileAvatar(url) {
    const avatarElements = document.querySelectorAll('.profile-info .avatar, .sidebar .profile-avatar img');
    avatarElements.forEach(el => {
      if (el.tagName === 'IMG') {
        el.src = url;
      } else {
        el.style.backgroundImage = `url(${url})`;
      }
    });
  }

  handleAddPhoto() {
    console.log('[PHOTO MANAGER] handleAddPhoto called');
    
    // Show global loading while waiting for file picker
    this.showGlobalLoading('Select a photo...');
    
    // Create a temporary file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.cssText = 'position: absolute; left: -9999px; opacity: 0;';
    
    // Add event listener
    fileInput.addEventListener('change', (e) => {
      console.log('[PHOTO MANAGER] File selected:', e.target.files[0]);
      // Hide waiting overlay as soon as selection is made
      this.hideGlobalLoading();
      this.handleFileSelect(e);
    });
    
    // Fallback: hide overlay when window regains focus (user closed picker without selecting)
    const onWindowFocus = () => {
      this.hideGlobalLoading();
      window.removeEventListener('focus', onWindowFocus);
    };
    window.addEventListener('focus', onWindowFocus, { once: true });
    
    // Add to body temporarily
    document.body.appendChild(fileInput);
    
    // Trigger click
    setTimeout(() => {
      fileInput.click();
    }, 100);
    
    // Remove after a short delay
    setTimeout(() => {
      if (fileInput.parentNode) {
        document.body.removeChild(fileInput);
      }
    }, 5000);
  }

  async handleFileSelect(event) {
    console.log('[PHOTO MANAGER] === FILE SELECT START ===');
    console.log('[PHOTO MANAGER] Event target:', event.target);
    console.log('[PHOTO MANAGER] Files array:', event.target.files);
    
    const file = event.target.files[0];
    console.log('[PHOTO MANAGER] Selected file:', file);
    
    if (!file) {
      console.log('[PHOTO MANAGER] No file selected');
      return;
    }

    console.log('[PHOTO MANAGER] File details:');
    console.log('  - Name:', file.name);
    console.log('  - Size:', file.size, 'bytes');
    console.log('  - Type:', file.type);
    console.log('  - Last modified:', new Date(file.lastModified));

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('[PHOTO MANAGER] Invalid file type:', file.type);
      this.showNotification('Please select an image file', 'error');
      return;
    }

    // Show loading
    this.showNotification('Uploading photo...', 'info');
    this.showGlobalLoading('Uploading photo...');

    try {
      // Step 1: Upload the photo
      const uploadResult = await this.uploadPhoto(file);
      
      if (uploadResult.success) {
        console.log('[PHOTO MANAGER] Upload successful, creating temp photo object');
        // Create temporary photo object
        const tempPhoto = {
          id: `temp-${Date.now()}`,
          serverId: uploadResult.id_photo,
          file: file,
          previewUrl: URL.createObjectURL(file),
          isNew: false, // mark as real so we don't create phantom entries
          accepted: 0,
          isDemo: uploadResult.isDemo || false
        };
        
        console.log('[PHOTO MANAGER] Temp photo created:', tempPhoto);
        
        // Add to photos array
        this.photos.push(tempPhoto);
        
        // Open crop modal for this photo
        console.log('[PHOTO MANAGER] Calling openCropModal...');
        this.openCropModal(tempPhoto);
        // Hide global loader once modal is opening
        this.hideGlobalLoading();
      } else {
        console.log('[PHOTO MANAGER] Upload failed:', uploadResult.error);
        this.showNotification(uploadResult.error || 'Upload failed', 'error');
        this.hideGlobalLoading();
      }
    } catch (error) {
      console.error('[PHOTO MANAGER] Upload error:', error);
      this.showNotification('Upload failed', 'error');
      this.hideGlobalLoading();
    }

    // Reset file input if it exists
    if (event.target && event.target.value !== undefined) {
      event.target.value = '';
    }
  }

  async uploadPhoto(file) {
    console.log('[PHOTO MANAGER] === UPLOAD PHOTO START ===');
    console.log('[PHOTO MANAGER] Starting upload for file:', file.name, 'size:', file.size);
    console.log('[PHOTO MANAGER] File object details:');
    console.log('  - Name:', file.name);
    console.log('  - Size:', file.size, 'bytes');
    console.log('  - Type:', file.type);
    console.log('  - Last modified:', new Date(file.lastModified));
    console.log('  - File object:', file);
    console.log('[PHOTO MANAGER] Session ID:', window.authManager.sessionId);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contenttype', 'photo'); // Добавляем как в документации

    // Try direct API call (no proxy) since Test 1 worked perfectly
    const apiUrl = `${this.apiConfig.baseUrl}/ajax_api/upload_photo?session_id=${window.authManager.sessionId}&api_key=${this.apiConfig.apiKey}&is_private=0`;
    console.log('[PHOTO MANAGER] Upload URL:', apiUrl);
    console.log('[PHOTO MANAGER] FormData contents:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}:`, {
          name: value.name,
          size: value.size,
          type: value.type,
          lastModified: new Date(value.lastModified)
        });
      } else {
        console.log(`  ${key}:`, value);
      }
    }
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      console.log('[PHOTO MANAGER] Full upload response:', JSON.stringify(result, null, 2));

      // Check if API returned an error
      // API может вернуть success: true/false или success: 0/1
      if (result.success === false || result.success === 0 || result.success === "0") {
        console.error('[PHOTO MANAGER] Upload failed:', result);
        
        // Если есть детальное сообщение об ошибке
        let errorMessage = 'Upload failed';
        if (result.result && result.result.error) {
          errorMessage = `Error code: ${result.result.error}`;
        } else if (result.error) {
          errorMessage = result.error;
        } else if (result.data) {
          errorMessage = result.data;
        }
        
        return {
          success: false,
          error: errorMessage
        };
      }
      
      // According to docs, API should return the photo number
      // Check for different possible response formats
      let photoId = null;
      
      // API returns {"result":{"id_photo":1}}
      if (result.result && result.result.id_photo) {
        photoId = result.result.id_photo;
      } else if (result.data && typeof result.data === 'number') {
        // Direct number in data
        photoId = result.data;
      } else if (result.data && result.data.id_photo) {
        // Object with id_photo
        photoId = result.data.id_photo;
      } else if (result.data && result.data.photo_num) {
        // Object with photo_num
        photoId = result.data.photo_num;
      } else if (result.data && result.data.id) {
        // Object with id
        photoId = result.data.id;
      }
      
      if (photoId) {
        console.log('[PHOTO MANAGER] Photo uploaded successfully, ID:', photoId);
        return {
          success: true,
          id_photo: photoId
        };
      }
      
      // If we can't find photo ID, log the response and fail
      console.error('[PHOTO MANAGER] Could not find photo ID in response:', result);
      return {
        success: false,
        error: 'Invalid response format - no photo ID found'
      };
      
    } catch (error) {
      console.error('[PHOTO MANAGER] Upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  openCropModal(photo) {
    console.log('[PHOTO MANAGER] === OPENING CROP MODAL ===');
    console.log('[PHOTO MANAGER] Photo object:', photo);
    console.log('[PHOTO MANAGER] Photo details:');
    console.log('  - ID:', photo.id);
    console.log('  - Server ID:', photo.serverId);
    console.log('  - Name:', photo.name);
    console.log('  - Preview URL:', photo.previewUrl);
    console.log('  - URL:', photo.url);
    console.log('  - Is new:', photo.isNew);
    console.log('  - File object:', photo.file);
    
    if (photo.file) {
      console.log('  - File name:', photo.file.name);
      console.log('  - File size:', photo.file.size);
      console.log('  - File type:', photo.file.type);
    }
    
    this.currentEditingPhoto = photo;
    const modal = document.getElementById('photoCropModal');
    if (!modal) {
      console.error('[PHOTO MANAGER] Modal not found!');
      return;
    }

    // Show modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    console.log('[PHOTO MANAGER] Modal displayed');
    // Ensure any global loading is hidden once modal is visible
    this.hideGlobalLoading();

    // Render thumbnails
    this.renderThumbnails();

    // Load image in crop container
    const cropImage = document.getElementById('cropImage');
    if (cropImage) {
      const imageUrl = photo.previewUrl || photo.url;
      console.log('[PHOTO MANAGER] Loading image in crop container, URL:', imageUrl);
      cropImage.src = imageUrl;
      cropImage.onload = () => {
        this.imageWidth = cropImage.naturalWidth;
        this.imageHeight = cropImage.naturalHeight;
        this.resetCropBox();
      };
    }

    // Set privacy options
    const publicRadio = document.getElementById('photoPublic');
    const privateRadio = document.getElementById('photoPrivate');
    const mainRadio = document.getElementById('photoMain');
    
    if (photo.isMain) {
      mainRadio.checked = true;
    } else if (photo.isPrivate) {
      privateRadio.checked = true;
    } else {
      publicRadio.checked = true;
    }

    // Clear title input
    const titleInput = document.getElementById('photoTitle');
    if (titleInput) {
      titleInput.value = '';
    }
  }

  renderThumbnails() {
    const container = document.getElementById('photoThumbnails');
    if (!container) return;

    container.innerHTML = '';

    // Add existing photos
    this.photos.forEach(photo => {
      const thumb = document.createElement('div');
      thumb.className = 'photo-thumb';
      if (photo.id === this.currentEditingPhoto?.id) {
        thumb.classList.add('active');
      }
      
      const img = document.createElement('img');
      img.src = photo.previewUrl || photo.url;
      thumb.appendChild(img);
      
      thumb.addEventListener('click', () => {
        if (photo.id !== this.currentEditingPhoto?.id) {
          this.openCropModal(photo);
        }
      });
      
      container.appendChild(thumb);
    });

    // Add "add new" button
    const addThumb = document.createElement('div');
    addThumb.className = 'photo-thumb add-new';
    addThumb.innerHTML = '+';
    addThumb.addEventListener('click', () => {
      this.closeCropModal();
      this.handleAddPhoto();
    });
    container.appendChild(addThumb);
  }

  initializeCropBox() {
    this.cropBox = document.getElementById('cropBox');
    this.cropContainer = document.getElementById('cropContainer');
    
    if (!this.cropBox || !this.cropContainer) return;

    // Add resize handles
    const handles = ['nw', 'ne', 'sw', 'se'];
    handles.forEach(handle => {
      const div = document.createElement('div');
      div.className = `resize-handle ${handle}`;
      div.dataset.handle = handle;
      this.cropBox.appendChild(div);
    });

    // Mouse events for dragging
    this.cropBox.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('resize-handle')) {
        this.startResize(e);
      } else {
        this.startDrag(e);
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.drag(e);
      } else if (this.isResizing) {
        this.resize(e);
      }
    });

    document.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.isResizing = false;
      this.activeHandle = null;
    });
  }

  resetCropBox() {
    if (!this.cropBox || !this.cropContainer) return;
    
    const containerRect = this.cropContainer.getBoundingClientRect();
    const size = Math.min(containerRect.width, containerRect.height) * 0.6;
    const left = (containerRect.width - size) / 2;
    const top = (containerRect.height - size) / 2;
    
    this.cropBox.style.width = size + 'px';
    this.cropBox.style.height = size + 'px';
    this.cropBox.style.left = left + 'px';
    this.cropBox.style.top = top + 'px';
  }

  startDrag(e) {
    this.isDragging = true;
    const rect = this.cropBox.getBoundingClientRect();
    const containerRect = this.cropContainer.getBoundingClientRect();
    this.startX = e.clientX - rect.left + containerRect.left;
    this.startY = e.clientY - rect.top + containerRect.top;
    e.preventDefault();
  }

  drag(e) {
    if (!this.isDragging) return;
    
    const containerRect = this.cropContainer.getBoundingClientRect();
    let newLeft = e.clientX - this.startX;
    let newTop = e.clientY - this.startY;
    
    // Constrain to container
    const cropWidth = this.cropBox.offsetWidth;
    const cropHeight = this.cropBox.offsetHeight;
    
    newLeft = Math.max(0, Math.min(newLeft, containerRect.width - cropWidth));
    newTop = Math.max(0, Math.min(newTop, containerRect.height - cropHeight));
    
    this.cropBox.style.left = newLeft + 'px';
    this.cropBox.style.top = newTop + 'px';
  }

  startResize(e) {
    this.isResizing = true;
    this.activeHandle = e.target.dataset.handle;
    const rect = this.cropBox.getBoundingClientRect();
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.startWidth = rect.width;
    this.startHeight = rect.height;
    this.startLeft = this.cropBox.offsetLeft;
    this.startTop = this.cropBox.offsetTop;
    e.preventDefault();
  }

  resize(e) {
    if (!this.isResizing || !this.activeHandle) return;
    
    const deltaX = e.clientX - this.startX;
    const deltaY = e.clientY - this.startY;
    const containerRect = this.cropContainer.getBoundingClientRect();
    
    let newWidth = this.startWidth;
    let newHeight = this.startHeight;
    let newLeft = this.startLeft;
    let newTop = this.startTop;
    
    // Maintain square aspect ratio
    switch (this.activeHandle) {
      case 'se':
        newWidth = this.startWidth + deltaX;
        newHeight = newWidth; // Square
        break;
      case 'sw':
        newWidth = this.startWidth - deltaX;
        newHeight = newWidth; // Square
        newLeft = this.startLeft + deltaX;
        break;
      case 'ne':
        newWidth = this.startWidth + deltaX;
        newHeight = newWidth; // Square
        newTop = this.startTop - deltaX;
        break;
      case 'nw':
        newWidth = this.startWidth - deltaX;
        newHeight = newWidth; // Square
        newLeft = this.startLeft + deltaX;
        newTop = this.startTop + deltaX;
        break;
    }
    
    // Minimum size
    const minSize = 100;
    if (newWidth < minSize) {
      newWidth = minSize;
      newHeight = minSize;
    }
    
    // Constrain to container
    if (newLeft < 0) {
      newWidth += newLeft;
      newLeft = 0;
    }
    if (newTop < 0) {
      newHeight += newTop;
      newTop = 0;
    }
    if (newLeft + newWidth > containerRect.width) {
      newWidth = containerRect.width - newLeft;
      newHeight = newWidth;
    }
    if (newTop + newHeight > containerRect.height) {
      newHeight = containerRect.height - newTop;
      newWidth = newHeight;
    }
    
    this.cropBox.style.width = newWidth + 'px';
    this.cropBox.style.height = newHeight + 'px';
    this.cropBox.style.left = newLeft + 'px';
    this.cropBox.style.top = newTop + 'px';
  }

  getCropCoordinates() {
    const containerRect = this.cropContainer.getBoundingClientRect();
    const cropRect = this.cropBox.getBoundingClientRect();
    const img = document.getElementById('cropImage');
    
    // Calculate scale factor
    const scaleX = this.imageWidth / img.width;
    const scaleY = this.imageHeight / img.height;
    
    // Calculate crop coordinates in original image dimensions
    const x = (cropRect.left - containerRect.left) * scaleX;
    const y = (cropRect.top - containerRect.top) * scaleY;
    const w = cropRect.width * scaleX;
    const h = cropRect.height * scaleY;
    
    // API requires SQUARE crop (w = h), use the smaller dimension
    const size = Math.min(Math.round(w), Math.round(h));
    
    console.log('[PHOTO MANAGER] Original crop:', { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
    console.log('[PHOTO MANAGER] Square crop size:', size);
    
    // Ensure we don't go outside image bounds
    const maxX = this.imageWidth - size;
    const maxY = this.imageHeight - size;
    const adjustedX = Math.max(0, Math.min(Math.round(x), maxX));
    const adjustedY = Math.max(0, Math.min(Math.round(y), maxY));
    
    console.log('[PHOTO MANAGER] Adjusted coords:', { x: adjustedX, y: adjustedY, w: size, h: size });
    console.log('[PHOTO MANAGER] Image dimensions:', { width: this.imageWidth, height: this.imageHeight });
    
    return {
      x: adjustedX,
      y: adjustedY,
      w: size,
      h: size
    };
  }

  async validatePhoto() {
    if (!this.currentEditingPhoto) return;
    
    const photo = this.currentEditingPhoto;
    const cropCoords = this.getCropCoordinates();
    
    // Get privacy setting
    let isPrivate = 0;
    let isMain = 0;
    
    if (document.getElementById('photoPrivate').checked) {
      isPrivate = 1;
    } else if (document.getElementById('photoMain').checked) {
      isMain = 1;
    }
    
    this.showNotification('Saving photo...', 'info');
    
    console.log('[PHOTO MANAGER] Validating photo with ID:', photo.serverId);
    console.log('[PHOTO MANAGER] Crop coordinates:', cropCoords);
    console.log('[PHOTO MANAGER] Privacy settings - isPrivate:', isPrivate, 'isMain:', isMain);
    
    try {
      // Call modify API to save crop and privacy settings
      // According to API docs, all parameters must be in query string
      const params = new URLSearchParams({
        session_id: window.authManager.sessionId,
        api_key: this.apiConfig.apiKey,
        photo_num: photo.serverId,
        is_private: isPrivate,
        x: cropCoords.x,
        y: cropCoords.y,
        w: cropCoords.w,
        h: cropCoords.h
      });
      
      // Add is_main if selected
      if (isMain) {
        params.append('is_main', '1');
      }
      
      console.log('[PHOTO MANAGER] Sending modify params:');
      for (let [key, value] of params.entries()) {
        console.log(`  ${key}: ${value}`);
      }
      
      // Direct API call (no proxy) - all params in URL as per API docs
      const apiUrl = `${this.apiConfig.baseUrl}/index_api/user_edit_photos/modify?${params.toString()}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST'
      });
      
      const result = await response.json();
      console.log('[PHOTO MANAGER] Full modify response:', JSON.stringify(result, null, 2));
      
      // Check for different success formats
      const isSuccess = result.success || 
                       (result.result && result.result.modify === "success") ||
                       (result.data && result.data.modify === "success") ||
                       (result.modify === "success");
                       
      if (isSuccess) {
        console.log('[PHOTO MANAGER] Photo modified successfully');
        
        // Update photo status
        photo.accepted = 1;
        photo.isPrivate = isPrivate;
        
        // If set as main, update main photo
        if (isMain) {
          await this.setAsMainPhoto(photo.serverId);
        }
        
        this.showNotification('Photo saved successfully!', 'success');
        
        // Simple solution: reload the page to refresh everything
        console.log('[PHOTO MANAGER] Reloading page to refresh gallery...');
        window.location.reload();
      } else {
        console.error('[PHOTO MANAGER] Failed to modify photo:', result);
        this.showNotification(result.error || 'Failed to save photo', 'error');
      }
    } catch (error) {
      console.error('[PHOTO MANAGER] Error saving photo:', error);
      this.showNotification('Error saving photo', 'error');
    }
  }

  async setAsMainPhoto(photoId) {
    // Direct API call (no proxy)
    const apiUrl = `${this.apiConfig.baseUrl}/index_api/user_edit_photos/principale?session_id=${window.authManager.sessionId}&api_key=${this.apiConfig.apiKey}&photo_num=${photoId}`;
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST'
      });
      const result = await response.json();
      console.log('[PHOTO MANAGER] Set main photo result:', result);
      
      if (result.success || result.modify === "success") {
        this.showNotification('Main photo updated!', 'success');
        
        // Simple solution: reload the page to refresh everything
        console.log('[PHOTO MANAGER] Reloading page to refresh gallery...');
        window.location.reload();
      }
    } catch (error) {
      console.error('[PHOTO MANAGER] Error setting main photo:', error);
      this.showNotification('Failed to set main photo', 'error');
    }
  }

  async deletePhotoById(photoId) {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    
    console.log('[PHOTO MANAGER] Deleting photo with ID:', photoId);
    console.log('[PHOTO MANAGER] Current photos before delete:', this.photos.map(p => ({ id: p.id, serverId: p.serverId, photoNum: p.photoNum })));
    
    try {
      // Use server proxy to ensure JSON and correct auth
      const apiUrl = `/api/spice-multi-test?endpoint=/index_api/user_edit_photos/del&method=POST&session_id=${window.authManager.sessionId}&photo_num=${Number(photoId)}`;
      const response = await fetch(apiUrl);
      const result = await response.json();
      console.log('[PHOTO MANAGER] Delete result (proxy):', result);
      
      const isSuccess = result.success || result.modify === 'success' || result.result?.del === 'success' || result.data?.result?.del === 'success';
      if (isSuccess) {
        this.showNotification('Photo deleted successfully!', 'success');
        
        // Simple solution: reload the page to refresh everything
        console.log('[PHOTO MANAGER] Reloading page to refresh gallery...');
        window.location.reload();
      } else {
        this.showNotification('Failed to delete photo', 'error');
      }
    } catch (error) {
      console.error('[PHOTO MANAGER] Error deleting photo:', error);
      this.showNotification('Error deleting photo', 'error');
    }
  }

  async deleteCurrentPhoto() {
    console.log('[PHOTO MANAGER] === DELETE CURRENT PHOTO START ===');
    console.log('[PHOTO MANAGER] Current editing photo:', this.currentEditingPhoto);
    
    if (!this.currentEditingPhoto) {
      console.error('[PHOTO MANAGER] ERROR: No current editing photo set!');
      return;
    }
    
    // Allow fallback to serverId if photoNum is missing
    if (!this.currentEditingPhoto.photoNum && this.currentEditingPhoto.serverId) {
      this.currentEditingPhoto.photoNum = this.currentEditingPhoto.serverId;
    }
    if (!this.currentEditingPhoto.photoNum) {
      console.error('[PHOTO MANAGER] ERROR: Current editing photo has no valid photoNum or serverId!', this.currentEditingPhoto);
      this.showNotification('Cannot delete this photo. Try again.', 'error');
      return;
    }
    
    console.log('[PHOTO MANAGER] Ready to delete photo with photoNum:', this.currentEditingPhoto.photoNum);
    
    // Use custom confirmation modal instead of system confirm
    console.log('[PHOTO MANAGER] Showing confirmation modal...');
    const confirmed = await this.showConfirmation('Are you sure you want to delete this photo?');
    console.log('[PHOTO MANAGER] Confirmation result:', confirmed);
    
    if (!confirmed) {
      console.log('[PHOTO MANAGER] User cancelled deletion');
      return;
    }
    
    const photoNum = Number(this.currentEditingPhoto.photoNum || this.currentEditingPhoto.serverId);
    if (!Number.isFinite(photoNum)) {
      console.error('[PHOTO MANAGER] ERROR: photoNum is not numeric:', photoNum);
      this.showNotification('Invalid photo id', 'error');
      return;
    }
    
    this.showNotification('Deleting photo...', 'info');
    this.showGlobalLoading('Deleting photo...');
    
    console.log('[PHOTO MANAGER] Proceeding with deletion, photoNum:', photoNum);
    console.log('[PHOTO MANAGER] Photos before deletion:', this.photos.length);
    
    try {
      // Use server proxy to ensure JSON and correct auth
      const apiUrl = `/api/spice-multi-test?endpoint=/index_api/user_edit_photos/del&method=POST&session_id=${window.authManager.sessionId}&photo_num=${photoNum}`;
      console.log('[PHOTO MANAGER] API URL (proxy):', apiUrl);
      const response = await fetch(apiUrl);
      const result = await response.json();
      console.log('[PHOTO MANAGER] API Delete result (proxy):', result);
      
      const isSuccess = result.success || result.modify === 'success' || result.result?.del === 'success' || result.data?.result?.del === 'success';
      if (isSuccess) {
        console.log('[PHOTO MANAGER] API deletion successful, updating local data...');
        
        this.showNotification('Photo deleted successfully!', 'success');
        
        // Close crop modal, then reload the page to refresh everything
        this.closeCropModal();
        this.hideGlobalLoading();
        console.log('[PHOTO MANAGER] Reloading page to refresh gallery...');
        window.location.reload();
        
        console.log('[PHOTO MANAGER] === DELETE PROCESS COMPLETED ===');
      } else {
        console.log('[PHOTO MANAGER] API deletion failed:', result);
        this.showNotification('Failed to delete photo', 'error');
        this.hideGlobalLoading();
      }
    } catch (error) {
      console.error('[PHOTO MANAGER] Error deleting photo:', error);
      this.showNotification('Error deleting photo', 'error');
      this.hideGlobalLoading();
    }
  }

  closeCropModal() {
    console.log('[PHOTO MANAGER] === CLOSING CROP MODAL ===');
    const modal = document.getElementById('photoCropModal');
    console.log('[PHOTO MANAGER] Modal element found:', !!modal);
    console.log('[PHOTO MANAGER] Modal current display:', modal ? modal.style.display : 'N/A');
    
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
      console.log('[PHOTO MANAGER] Modal hidden and body overflow reset');
    } else {
      console.error('[PHOTO MANAGER] Could not find photoCropModal element!');
    }
    
    // Clean up temporary preview URLs only if photo wasn't saved
    if (this.currentEditingPhoto?.previewUrl && !this.currentEditingPhoto.accepted) {
      URL.revokeObjectURL(this.currentEditingPhoto.previewUrl);
      console.log('[PHOTO MANAGER] Cleaned up preview URL');
    }
    
    console.log('[PHOTO MANAGER] === CROP MODAL CLOSE COMPLETED ===');
    // Note: We don't clear currentEditingPhoto here because deleteCurrentPhoto does it
  }

  renderPhotoGallery() {
    console.log('[PHOTO MANAGER] === RENDERING PHOTO GALLERY ===');
    console.log('[PHOTO MANAGER] Current photos count:', this.photos.length);
    console.log('[PHOTO MANAGER] Photos array:', this.photos.map(p => ({ photoNum: p.photoNum, isMain: p.isMain })));
    
    const gallery = document.getElementById('photoGallery');
    console.log('[PHOTO MANAGER] Gallery element found:', !!gallery);
    if (!gallery) {
      console.error('[PHOTO MANAGER] Could not find photoGallery element!');
      return;
    }

    // Clear gallery first
    gallery.innerHTML = '';
    console.log('[PHOTO MANAGER] Gallery cleared');
    
    // Update photo count (exclude temporary new photos)
    const photoCount = document.getElementById('photoCount');
    console.log('[PHOTO MANAGER] Photo count element found:', !!photoCount);
    if (photoCount) {
      const realCount = this.photos.filter(p => !p.isNew).length;
      photoCount.textContent = `${realCount}/10 photos`;
      console.log('[PHOTO MANAGER] Photo count updated to:', photoCount.textContent);
    } else {
      console.error('[PHOTO MANAGER] Photo count element not found! Looking for #photoCount');
    }

    // If no photos, show upload zone
    if (this.photos.length === 0) {
      gallery.innerHTML = `
        <div class="photo-upload-zone" id="photoUploadZone">
          <div class="upload-icon">📸</div>
          <h5>Add Photos</h5>
          <p>Drag & drop photos here or click to browse</p>
          <div class="upload-formats">JPG, PNG, GIF up to 5MB</div>
        </div>
      `;
      
      // Re-attach event listeners for the upload zone
      const uploadZone = document.getElementById('photoUploadZone');
      if (uploadZone) {
        uploadZone.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleAddPhoto();
        });
        
        // Drag and drop events
        uploadZone.addEventListener('dragover', (e) => {
          e.preventDefault();
          uploadZone.classList.add('drag-over');
        });
        
        uploadZone.addEventListener('dragleave', () => {
          uploadZone.classList.remove('drag-over');
        });
        
        uploadZone.addEventListener('drop', (e) => {
          e.preventDefault();
          uploadZone.classList.remove('drag-over');
          
          const files = e.dataTransfer.files;
          if (files.length > 0 && files[0].type.startsWith('image/')) {
            this.handleFileSelect({ target: { files: [files[0]] } });
          }
        });
      }
      return;
    }

    // Render existing photos (skip temporary items created during upload)
    this.photos.filter(p => !p.isNew).forEach(photo => {
      const photoCard = document.createElement('div');
      photoCard.className = 'photo-card';
      if (photo.isMain) photoCard.classList.add('main-photo');

      photoCard.innerHTML = `
        <img src="${photo.url || photo.previewUrl}" alt="Profile photo" loading="lazy">
        <div class="photo-info">
          ${photo.isMain ? '<div class="main-badge">Main</div>' : ''}
          ${photo.isPrivate ? '<div class="private-badge">Private</div>' : '<div class="public-badge">Public</div>'}
        </div>
        <div class="photo-overlay">
          <div class="photo-actions">
            <button class="btn-photo-action edit" title="Edit Photo">✏️</button>
          </div>
        </div>
      `;

      photoCard.addEventListener('click', () => {
        if (!photo.isNew) {
          this.openCropModal(photo);
        }
      });

      gallery.appendChild(photoCard);
    });

    // Добавляем плитку "+" для добавления нового фото
    const addCard = document.createElement('div');
    addCard.className = 'photo-card add-photo-card';
    addCard.innerHTML = `
      <button type="button" class="add-photo-btn" aria-label="Add Photo">
        <div class="add-icon">+</div>
        <div>Add Photo</div>
      </button>
    `;
    const addClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleAddPhoto();
    };
    addCard.addEventListener('click', addClick);
    const addBtn = addCard.querySelector('.add-photo-btn');
    if (addBtn) {
      addBtn.addEventListener('click', addClick);
      addBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          addClick(e);
        }
      });
    }
    gallery.appendChild(addCard);
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  showConfirmation(message) {
    return new Promise((resolve) => {
      const modal = document.getElementById('confirmationModal');
      const messageEl = document.getElementById('confirmationMessage');
      const cancelBtn = document.getElementById('confirmationCancel');
      const confirmBtn = document.getElementById('confirmationConfirm');

      if (!modal || !messageEl || !cancelBtn || !confirmBtn) {
        console.warn('[PHOTO MANAGER] Confirmation modal elements not found, using native confirm()');
        const ok = window.confirm(message || 'Are you sure?');
        resolve(!!ok);
        return;
      }

      messageEl.textContent = message;
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';

      const handleCancel = () => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        cancelBtn.removeEventListener('click', handleCancel);
        confirmBtn.removeEventListener('click', handleConfirm);
        resolve(false);
      };

      const handleConfirm = () => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        cancelBtn.removeEventListener('click', handleCancel);
        confirmBtn.removeEventListener('click', handleConfirm);
        resolve(true);
      };

      cancelBtn.addEventListener('click', handleCancel);
      confirmBtn.addEventListener('click', handleConfirm);

      // Close on overlay click
      modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-overlay')) {
          handleCancel();
        }
      });
    });
  }

  // Global loading overlay helpers
  ensureGlobalLoadingOverlay() {
    let overlay = document.getElementById('loadingOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loadingOverlay';
      overlay.className = 'loading-overlay';
      overlay.innerHTML = `
        <div class="loading-spinner"></div>
        <p id="loadingOverlayText">Loading...</p>
      `;
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  showGlobalLoading(text = 'Loading...') {
    const overlay = this.ensureGlobalLoadingOverlay();
    const textEl = document.getElementById('loadingOverlayText');
    if (textEl) textEl.textContent = text;
    overlay.classList.add('active');
  }

  hideGlobalLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('active');
  }
}

// Create and export instance
const photoManager = new PhotoManager();
window.photoManager = photoManager; // Make it globally accessible
window.PhotoManager = PhotoManager; // Make class accessible too