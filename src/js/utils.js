class KubekAlerts {
    static stylesInjected = false;

    static injectStyles() {
        if (this.stylesInjected) return;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            @keyframes fadeOut {
                from {
                    opacity: 1;
                    transform: translateY(0) translateX(-50%);
                }
                to {
                    opacity: 0;
                    transform: translateY(20px) translateX(-50%);
                }
            }

            .animate__animated {
                animation-duration: 0.5s;
                animation-fill-mode: both;
            }

            .animate__faster {
                animation-duration: 0.3s !important;
            }

            .animate__fadeIn {
                animation-name: fadeIn;
            }

            .animate__fadeOut {
                animation-name: fadeOut;
            }

            .alert {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                align-items: center;
                gap: 12px;
                background: #1a1a1a;
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                max-width: 90%;
                width: max-content;
                z-index: 1000;
                cursor: pointer;
                transition: 0.2s all ease;
            }

            .alert:hover {
            }

            .icon-bg {
                background: rgba(255, 255, 255, 0.1);
                padding: 8px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .icon-bg span {
                font-size: 20px;
                display: block;
                width: 24px;
                height: 24px;
            }

            .content-2 {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .caption {
                font-weight: 500;
                font-size: 14px;
                line-height: 1.4;
            }

            .description {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.7);
                line-height: 1.4;
            }
        `;

        document.head.appendChild(style);
        this.stylesInjected = true;
    }

    static addAlert(
        text,
        icon = "info",
        description = "",
        duration = 5000,
        iconClasses = "",
        callback = () => {}
    ) {
        this.injectStyles();
        const newID = this.generateAlertID();
        
        const alertHTML = `
            <div id="alert-${newID}" class="alert animate__animated animate__fadeIn animate__faster">
                ${this.buildIconSection(icon, iconClasses)}
                ${this.buildContentSection(text, description)}
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', alertHTML);
        const alertElement = document.getElementById(`alert-${newID}`);
        
        alertElement.addEventListener('click', () => this.handleAlertClick(alertElement, callback));
        
        if (duration > 0) {
            this.setAutoDismiss(alertElement, duration);
        }
    }

    static buildIconSection(icon, iconClasses) {
        const classes = iconClasses ? `icon-bg ${iconClasses}` : 'icon-bg';
        return `
            <div class="${classes}">
                <span class="material-symbols-rounded">${icon}</span>
            </div>
        `;
    }

    static buildContentSection(text, description) {
        return description 
            ? `<div class="content-2">
                <div class="caption">${text}</div>
                <div class="description">${description}</div>
               </div>`
            : `<div class="caption">${text}</div>`;
    }

    static handleAlertClick(alertElement, callback) {
        alertElement.remove();
        callback();
    }

    static setAutoDismiss(alertElement, duration) {
        setTimeout(() => {
            alertElement.classList.add('animate__fadeOut');
            alertElement.addEventListener('animationend', () => alertElement.remove());
        }, duration);
    }

    static generateAlertID() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static removeAllAlerts() {
        document.querySelectorAll('.alert').forEach(alert => alert.remove());
    }
}
