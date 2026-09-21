// The prototype template references images under `public/images/`, but the files
// actually live in `prototype/images/` -- they are copied to `assets/images/`
// here and resolved through this map so nothing 404s.
export const IMAGES: Record<string, number> = {
  'logo.png': require('../../assets/images/logo.png'),
  'HomePage1.webp': require('../../assets/images/HomePage1.webp'),
  'illustration-exchange-item.webp': require('../../assets/images/illustration-exchange-item.webp'),
  'illustration-treasure-chest.webp': require('../../assets/images/illustration-treasure-chest.webp'),
  'hero-boy-with-dog.webp': require('../../assets/images/hero-boy-with-dog.webp'),
  'feature-report-found.webp': require('../../assets/images/feature-report-found.webp'),
  'feature-search-system.webp': require('../../assets/images/feature-search-system.webp'),
  'feature-success-stories.webp': require('../../assets/images/feature-success-stories.webp'),
};
export const img = (name: string) => IMAGES[name];
