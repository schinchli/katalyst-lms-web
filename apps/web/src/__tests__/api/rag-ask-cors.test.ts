import { OPTIONS } from '@/app/api/rag/ask/route';

describe('RAG Ask API CORS', () => {
  it('allows public browser POST requests', () => {
    const response = OPTIONS();

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('access-control-allow-methods')).toContain('POST');
    expect(response.headers.get('access-control-allow-headers')).toContain('Content-Type');
  });
});
