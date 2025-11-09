/**
 * Error Popup UI Component
 * Displays themed error messages matching the game's design
 */

class ErrorPopup {
  /**
   * Show an error popup
   * @param {string} message - Error message to display
   * @param {string} title - Optional popup title (default: "Error")
   * @param {number} duration - Duration to show in ms (default: 5000)
   * @returns {HTMLElement} The popup element
   */
  static show(message, title = '❌ Error', duration = 5000) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'error-popup-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 999;
      animation: fadeIn 0.3s ease-out;
    `;

    // Create popup container
    const popup = document.createElement('div');
    popup.className = 'error-popup';
    popup.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border: 2px solid #ef4444;
      border-radius: 12px;
      padding: 30px;
      max-width: 400px;
      min-width: 300px;
      box-shadow: 
        0 0 20px rgba(239, 68, 68, 0.3),
        0 0 40px rgba(0, 0, 0, 0.8),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      font-family: Arial, sans-serif;
      animation: slideDown 0.3s ease-out;
    `;

    // Create title
    const titleEl = document.createElement('div');
    titleEl.className = 'error-popup-title';
    titleEl.textContent = title;
    titleEl.style.cssText = `
      font-size: 20px;
      font-weight: bold;
      color: #ef4444;
      margin-bottom: 15px;
      text-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
    `;

    // Create message
    const messageEl = document.createElement('div');
    messageEl.className = 'error-popup-message';
    messageEl.textContent = message;
    messageEl.style.cssText = `
      font-size: 14px;
      color: #e5e7eb;
      line-height: 1.6;
      margin-bottom: 20px;
      word-wrap: break-word;
    `;

    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Dismiss';
    closeBtn.style.cssText = `
      width: 100%;
      padding: 10px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
    `;

    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.transform = 'translateY(-2px)';
      closeBtn.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
    });

    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.transform = 'translateY(0)';
      closeBtn.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)';
    });

    closeBtn.addEventListener('click', () => {
      ErrorPopup.hide(overlay);
    });

    // Assemble popup
    popup.appendChild(titleEl);
    popup.appendChild(messageEl);
    popup.appendChild(closeBtn);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Add styles to document head if not already present
    if (!document.getElementById('error-popup-styles')) {
      const styles = document.createElement('style');
      styles.id = 'error-popup-styles';
      styles.textContent = `
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-30px);
          }
        }

        .error-popup-exit {
          animation: slideUp 0.3s ease-out !important;
        }
      `;
      document.head.appendChild(styles);
    }

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        ErrorPopup.hide(overlay);
      }, duration);
    }

    console.log(`🚨 Error popup shown: ${title} - ${message}`);

    return overlay;
  }

  /**
   * Show a warning popup
   * @param {string} message - Warning message
   * @param {number} duration - Duration in ms (default: 5000)
   */
  static warning(message, duration = 5000) {
    const overlay = document.createElement('div');
    overlay.className = 'warning-popup-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 999;
      animation: fadeIn 0.3s ease-out;
    `;

    const popup = document.createElement('div');
    popup.className = 'warning-popup';
    popup.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border: 2px solid #f59e0b;
      border-radius: 12px;
      padding: 30px;
      max-width: 400px;
      min-width: 300px;
      box-shadow: 
        0 0 20px rgba(245, 158, 11, 0.3),
        0 0 40px rgba(0, 0, 0, 0.8),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      font-family: Arial, sans-serif;
      animation: slideDown 0.3s ease-out;
    `;

    const titleEl = document.createElement('div');
    titleEl.textContent = '⚠️ Warning';
    titleEl.style.cssText = `
      font-size: 20px;
      font-weight: bold;
      color: #f59e0b;
      margin-bottom: 15px;
      text-shadow: 0 0 10px rgba(245, 158, 11, 0.3);
    `;

    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.cssText = `
      font-size: 14px;
      color: #e5e7eb;
      line-height: 1.6;
      margin-bottom: 20px;
      word-wrap: break-word;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Dismiss';
    closeBtn.style.cssText = `
      width: 100%;
      padding: 10px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
    `;

    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.transform = 'translateY(-2px)';
      closeBtn.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.4)';
    });

    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.transform = 'translateY(0)';
      closeBtn.style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.3)';
    });

    closeBtn.addEventListener('click', () => {
      ErrorPopup.hide(overlay);
    });

    popup.appendChild(titleEl);
    popup.appendChild(messageEl);
    popup.appendChild(closeBtn);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    if (duration > 0) {
      setTimeout(() => {
        ErrorPopup.hide(overlay);
      }, duration);
    }

    console.log(`⚠️ Warning popup shown: ${message}`);

    return overlay;
  }

  /**
   * Show a success popup
   * @param {string} message - Success message
   * @param {number} duration - Duration in ms (default: 3000)
   */
  static success(message, duration = 3000) {
    const overlay = document.createElement('div');
    overlay.className = 'success-popup-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 999;
      animation: fadeIn 0.3s ease-out;
    `;

    const popup = document.createElement('div');
    popup.className = 'success-popup';
    popup.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border: 2px solid #10b981;
      border-radius: 12px;
      padding: 30px;
      max-width: 400px;
      min-width: 300px;
      box-shadow: 
        0 0 20px rgba(16, 185, 129, 0.3),
        0 0 40px rgba(0, 0, 0, 0.8),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      font-family: Arial, sans-serif;
      animation: slideDown 0.3s ease-out;
      text-align: center;
    `;

    const titleEl = document.createElement('div');
    titleEl.textContent = '✅ Success';
    titleEl.style.cssText = `
      font-size: 20px;
      font-weight: bold;
      color: #10b981;
      margin-bottom: 15px;
      text-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
    `;

    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.cssText = `
      font-size: 14px;
      color: #e5e7eb;
      line-height: 1.6;
      word-wrap: break-word;
    `;

    popup.appendChild(titleEl);
    popup.appendChild(messageEl);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    if (duration > 0) {
      setTimeout(() => {
        ErrorPopup.hide(overlay);
      }, duration);
    }

    console.log(`✅ Success popup shown: ${message}`);

    return overlay;
  }

  /**
   * Hide/remove a popup
   * @param {HTMLElement} overlay - The overlay element to remove
   */
  static hide(overlay) {
    if (!overlay) return;

    overlay.classList.add('error-popup-exit');
    setTimeout(() => {
      overlay.remove();
    }, 300);
  }

  /**
   * Hide all popups
   */
  static hideAll() {
    document.querySelectorAll('.error-popup-overlay, .warning-popup-overlay, .success-popup-overlay').forEach(el => {
      ErrorPopup.hide(el);
    });
  }
}

// Make globally available
if (typeof window !== 'undefined') {
  window.ErrorPopup = ErrorPopup;
  console.log('✅ ErrorPopup available as window.ErrorPopup');
}
