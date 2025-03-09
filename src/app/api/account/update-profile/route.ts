// app/api/account/update-profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

export async function PATCH(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    );
  }

  try {
    const { name } = await request.json();

    // 名前の更新
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ name })
      .eq('id', session.user.id)
      .select('id, email, name, role')
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'プロフィールの更新に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'プロフィールを更新しました',
      user: {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role
      }
    });
  } catch (error) {
    console.error('プロフィール更新エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
