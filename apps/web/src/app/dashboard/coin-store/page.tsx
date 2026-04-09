'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function CoinStorePage() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/quizzes'); }, [router]);
  return null;
}
