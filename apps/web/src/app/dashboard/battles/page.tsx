'use client';
export const dynamic = 'force-dynamic';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/quizzes'); }, [router]);
  return null;
}
