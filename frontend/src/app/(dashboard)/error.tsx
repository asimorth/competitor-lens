'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <CardTitle>Bir hata oluştu</CardTitle>
          </div>
          <CardDescription>
            {error.message || 'Sayfa yüklenirken bir sorun oluştu.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>Muhtemel sebepler:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Backend servisi çalışmıyor olabilir</li>
                <li>API bağlantı sorunu olabilir</li>
                <li>Veritabanı bağlantısı kopmuş olabilir</li>
              </ul>
            </div>
            <Button onClick={reset} className="w-full">
              Tekrar Dene
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
