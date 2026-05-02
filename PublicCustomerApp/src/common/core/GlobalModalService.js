let modalHandler = null;

export const registerGlobalModal = handler => {
  modalHandler = handler;
};

export const unregisterGlobalModal = () => {
  modalHandler = null;
};

export const showGlobalModal = (title, message, options) => {
  if (modalHandler?.show) {
    modalHandler.show(title, message, options);
  }
};

export const hideGlobalModal = () => {
  if (modalHandler?.hide) {
    modalHandler.hide();
  }
};
