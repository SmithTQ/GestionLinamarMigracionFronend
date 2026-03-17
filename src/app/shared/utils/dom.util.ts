export const toggleBodyClass = (className: string, shouldAdd: boolean): void => {
  document.body.classList.toggle(className, shouldAdd);
};
