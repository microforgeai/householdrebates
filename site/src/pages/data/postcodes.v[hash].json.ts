import type { APIRoute } from 'astro';
import { buildCompactPostcodeArtifact } from '../../lib/checker/postcode-compact';

export function getStaticPaths() {
  const artifact = buildCompactPostcodeArtifact();
  console.log(
    `postcodes-compact: ${artifact.url} (${artifact.rawBytes} bytes raw, ${artifact.gzipBytes} bytes gzipped)`,
  );
  return [{ params: { hash: artifact.hash } }];
}

export const GET: APIRoute = () => {
  const artifact = buildCompactPostcodeArtifact();
  return new Response(artifact.json, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
