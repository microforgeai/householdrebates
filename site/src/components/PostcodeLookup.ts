import { h, render } from 'preact';
import {
  PostcodeLookupApp,
  type PostcodeLookupBootstrapPayload,
} from './PostcodeLookupApp';

const mountEl = document.querySelector<HTMLElement>('[data-postcode-island]');
const bootstrapEl = document.getElementById('postcode-lookup-bootstrap');

if (mountEl && bootstrapEl?.textContent) {
  try {
    const bootstrap = JSON.parse(
      bootstrapEl.textContent,
    ) as PostcodeLookupBootstrapPayload;
    render(h(PostcodeLookupApp, { bootstrap }), mountEl);
  } catch (err) {
    console.error('Failed to mount Victorian Postcode Lookup', err);
  }
}
