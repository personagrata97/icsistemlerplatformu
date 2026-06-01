// Modal Control Functions
window.openModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        console.log(`✅ Opened modal: ${modalId}`);
    } else {
        console.error(`❌ Modal not found: ${modalId}`);
    }
}

window.closeModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        // Reset form if exists
        const form = modal.querySelector('form');
        if (form) form.reset();
        console.log(`✅ Closed modal: ${modalId}`);
    }
}

// Global Confirm Dialog
window.showConfirmDialog = function (title, htmlMessage, onConfirm, confirmText = 'Onayla', confirmColor = 'var(--primary)') {
    let dialog = document.getElementById('global-confirm-dialog');
    if (!dialog) {
        const dialogHtml = `
        <div class="modal-overlay" id="global-confirm-dialog" style="z-index: 9999;">
            <div class="modal" style="max-width: 500px;">
                <div class="modal-header">
                    <h3 class="modal-title" id="confirm-title"></h3>
                    <button class="close-modal" onclick="closeConfirmDialog()"><i data-lucide="x"></i></button>
                </div>
                <div class="modal-body" id="confirm-message" style="margin-bottom: 1.5rem; line-height: 1.6; color: var(--text-main);"></div>
                <div class="modal-footer" style="justify-content: flex-end; gap: 1rem;">
                    <button class="btn btn-secondary" onclick="closeConfirmDialog()">İptal</button>
                    <button class="btn btn-primary" id="confirm-btn">Onayla</button>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', dialogHtml);
        dialog = document.getElementById('global-confirm-dialog');
        lucide.createIcons();
    }

    dialog.querySelector('#confirm-title').textContent = title;

    // IMPORTANT: Use innerHTML to allow forms and formatting
    dialog.querySelector('#confirm-message').innerHTML = htmlMessage;

    const confirmBtn = dialog.querySelector('#confirm-btn');
    confirmBtn.textContent = confirmText;
    confirmBtn.style.background = confirmColor;

    // Clone button to remove old listeners
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

    newBtn.onclick = () => {
        try {
            if (onConfirm) onConfirm();
        } catch (error) {
            console.error("Error executing confirm action:", error);
            if (window.showToast) window.showToast('İşlem sırasında bir hata oluştu!', 'error');
        } finally {
            closeConfirmDialog();
        }
    };

    dialog.style.display = 'flex';
}

window.closeConfirmDialog = function () {
    const dialog = document.getElementById('global-confirm-dialog');
    if (dialog) dialog.style.display = 'none';
}
