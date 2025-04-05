// app/api/delete-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import cloudinary from 'cloudinary';

// Cloudinaryの設定
cloudinary.v2.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function DELETE(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    );
  }

  try {
    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        { error: '画像IDが必要です' },
        { status: 400 }
      );
    }

    // Cloudinaryから画像を削除
    const result = await cloudinary.v2.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      throw new Error('画像の削除に失敗しました');
    }

    return NextResponse.json({ message: '画像が正常に削除されました' });
  } catch (error) {
    console.error('画像削除エラー:', error);
    return NextResponse.json(
      { error: '画像の削除に失敗しました' },
      { status: 500 }
    );
  }
}