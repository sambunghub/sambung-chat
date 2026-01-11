export default {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{svelte}': ['prettier --write'],
  '*.{json,md,css,scss}': ['prettier --write'],
};
