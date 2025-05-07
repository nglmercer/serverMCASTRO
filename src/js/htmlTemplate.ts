interface OptionModal {
    icon: string;
    text: string;
    id?:string;
    class?: {
        font?: string;
        container?: string;
    };
}

const optionsModal = (option: OptionModal) => {
    return /*html*/ `
<div class="${option.class?.container || 'dropdown-item'}" ${option.id ? `id="${option.id}"` : ''}>
  <span class="material-symbols-rounded">${option.icon}</span>
  <span class="${option.class?.font || 'default-font'}">${option.text}</span>
</div>`;
};


export {
    optionsModal
}