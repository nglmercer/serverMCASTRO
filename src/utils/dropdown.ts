export interface OptionModal {
    icon: string;
    text: string;
    id?:string;
    class?: {
        font?: string;
        container?: string;
    };
}
export interface Modaltemplate {
    html: string;
    callback: () => void;
}
export const optionsModal = (option: OptionModal) => {
    return /*html*/ `
<div class="${option.class?.container || 'dropdown-item'}" ${option.id ? `id="${option.id}"` : ''}>
  <span class="material-symbols-rounded">${option.icon}</span>
  <span class="${option.class?.font || 'default-font'}">${option.text}</span>
</div>`;
};
export function setPopupOptions(popup:any,popupOptions: Modaltemplate[], event: Event) {
    if (popup && 'setOptions' in popup) {
        // Use the component methods directly
        (popup).setOptions(popupOptions);
        (popup).show(event);
      } else {
        // Fallback to window.solidComponents
        const solidPopup = (window as any).solidComponents?.serverOptions;
        if (solidPopup) {
          solidPopup.setOptions(popupOptions);
          solidPopup.show(event);
        }
      }
}