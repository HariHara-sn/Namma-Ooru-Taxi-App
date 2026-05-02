/* Lightweight shims to avoid runtime crashes on environments without Intl */
/* eslint-disable no-undef */
if (typeof global !== 'undefined') {
  if (typeof global.Intl === 'undefined') {
    global.Intl = {};
  }
}


