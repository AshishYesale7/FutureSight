import type {NextConfig} from 'next';

// Get the repository name from an environment variable.
// This is automatically set by GitHub Actions (e.g., "owner/repo-name").
// We extract just the "repo-name" part.
// If not in GitHub Actions (e.g., local dev), it defaults to an empty string or a placeholder.
const repoName = process.env.GITHUB_REPOSITORY
  ? process.env.GITHUB_REPOSITORY.split('/')[1]
  : 'your-repo-name-placeholder'; // Replace 'your-repo-name-placeholder' if testing basePath locally

const isGithubActions = process.env.GITHUB_ACTIONS === 'true';

const nextConfig: NextConfig = {
  output: 'export', // Crucial for static site generation

  // Only set basePath and assetPrefix when building for GitHub Pages
  ...(isGithubActions && {
    basePath: `/${repoName}`,
    // assetPrefix should typically match basePath for GitHub Pages deployments
    // Next.js handles adding /_next/ etc. correctly.
    assetPrefix: `/${repoName}`,
  }),

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // GitHub Pages doesn't support Next.js default image optimization server.
    // Setting unoptimized to true will serve images as-is.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
