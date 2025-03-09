
// app/api/account/change-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    );
  }

  try {
    const { currentPassword, newPassword } = await request.json();

    // ユーザー情報を取得
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('password')
      .eq('id', session.user.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 500 }
      );
    }

    // 現在のパスワードを検証
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '現在のパスワードが正しくありません' },
        { status: 400 }
      );
    }

    // 新しいパスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // パスワードを更新
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', session.user.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'パスワードの更新に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'パスワードを更新しました'
    });
  } catch (error) {
    console.error('パスワード更新エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}