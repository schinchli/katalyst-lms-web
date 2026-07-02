/** Jest mock for @sanity/image-url (ESM-only). */
const chain = {
  image: () => chain,
  width: () => chain,
  height: () => chain,
  auto: () => chain,
  url: () => 'https://example.test/image.png',
};
export default function imageUrlBuilder() {
  return chain;
}
