// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

// ユーザー一覧取得 (管理者のみ)
export async function GET() {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    );
  }

  // 管理者権限の確認
  if (session.user.role !== 'admin') {
    return NextResponse.json(
      { error: '管理者権限が必要です' },
      { status: 403 }
    );
  }

  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error('ユーザー一覧の取得エラー:', error);
    return NextResponse.json(
      { error: 'ユーザー一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}
