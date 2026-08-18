/**
 * CDN Configuration for External Dependencies
 * 
 * This file manages dependencies loaded from CDN to reduce bundle size.
 * Only used in production builds for Cloudflare Pages.
 */

export const CDN_DEPENDENCIES = {
  recharts: {
    url: 'https://cdn.jsdelivr.net/npm/recharts@3.6.0/dist/Recharts.min.js',
    global: 'Recharts',
    fallback: () => import('recharts'),
  },
  'framer-motion': {
    url: 'https://cdn.jsdelivr.net/npm/framer-motion@12.23.26/dist/framer-motion.min.js',
    global: 'FramerMotion',
    fallback: () => import('framer-motion'),
  },
} as const;

export type CDNDependency = keyof typeof CDN_DEPENDENCIES;

/**
 * Load a dependency from CDN with fallback to npm package
 */
export async function loadFromCDN<T = unknown>(
  dependency: CDNDependency
): Promise<T> {
  const config = CDN_DEPENDENCIES[dependency];
  
  // In development or if CDN fails, use npm package
  if (process.env.NODE_ENV === 'development') {
    return config.fallback() as Promise<T>;
  }

  // Check if already loaded
  if (typeof window !== 'undefined' && (window as any)[config.global]) {
    return (window as any)[config.global] as T;
  }

  // Try to load from CDN
  try {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = config.url;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    
    return (window as any)[config.global] as T;
  } catch (error) {
    console.warn(`Failed to load ${dependency} from CDN, using fallback`, error);
    return config.fallback() as Promise<T>;
  }
}
