// app/api/admin/users/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

// ユーザーの役割を更新 (管理者のみ)
export async function PATCH(
  request: NextRequest,
  context: { params: { userId: string } }
) {
  const session = await auth();
  const { userId } = await context.params;
  
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
    const { role } = await request.json();

    if (!role || !['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { error: '有効な役割を指定してください' },
        { status: 400 }
      );
    }

    // 自分自身の役割は変更できないようにする
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: '自分自身の役割は変更できません' },
        { status: 400 }
      );
    }

    // ユーザーの役割を更新
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select('id, email, name, role')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('ユーザー役割の更新エラー:', error);
    return NextResponse.json(
      { error: 'ユーザー役割の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// ユーザーを削除 (管理者のみ)
export async function DELETE(
  request: NextRequest,
  context: { params: { userId: string } }
) {
  const session = await auth();
  const { userId } = await context.params;
  
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

  // 自分自身の削除は禁止
  if (userId === session.user.id) {
    return NextResponse.json(
      { error: '自分自身を削除することはできません' },
      { status: 400 }
    );
  }

  try {
    // ユーザーが存在するか確認
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // ユーザーを削除
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { message: 'ユーザーが正常に削除されました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('ユーザー削除エラー:', error);
    return NextResponse.json(
      { error: 'ユーザーの削除に失敗しました' },
      { status: 500 }
    );
  }
}