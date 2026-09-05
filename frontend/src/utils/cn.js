/**
 * Utility to combine CSS class names cleanly without external dependencies.
 * Filters out falsy values (null, undefined, false, empty strings) and joins them.
 * 
 * @param  {...(string|boolean|null|undefined)} inputs - Class names or conditions
 * @returns {string} - Joined class names
 */
export function cn(...inputs) {
  return inputs
    .flat()
    .filter(Boolean)
    .join(' ');
}
