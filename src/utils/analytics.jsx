// src/utils/Analytics.jsx

/**
 * Send a Google Analytics event via gtag.js.
 *
 * @param {string} eventName     – The GA event name (e.g. 'page_view', 'quiz_completed').
 * @param {Object} params        – An object of parameters:
 *    {string} category        – event_category
 *    {string} label           – event_label
 *    {number} [value]         – event_value (optional)
 *    {Object} [customParams]  – any additional GA params
 */
export function trackEvent(
  eventName,
  {
    category,
    label,
    value,
    customParams = {}
  }
) {
  if (typeof window.gtag === 'function') {
    // Build the gtag payload
    const payload = {
      event_category: category,
      event_label: label,
      ...(typeof value === 'number' && { value }),
      page_path: window.location.pathname,
      ...customParams
    };

    window.gtag('event', eventName, payload);
  } else {
    console.warn(
      'gtag not defined, event:',
      eventName,
      category,
      label,
      value,
      customParams
    );
  }
}
