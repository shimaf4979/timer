// app/api/pins/[pinId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

// ピン情報の更新
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ pinId: string }> }
) {
  const session = await auth();
  const { pinId } = await context.params;

  if (!session?.user) {
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    );
  }

  try {
    // ピンを取得してアクセス権をチェック
    const { data: pin, error: pinError } = await supabaseAdmin
      .from('pins')
      .select('id, floor_id')
      .eq('id', pinId)
      .single();

    if (pinError || !pin) {
      return NextResponse.json(
        { error: 'ピンが見つかりません' },
        { status: 404 }
      );
    }

    // 権限チェック（エリア -> マップ -> ユーザー）
    const { data: floor } = await supabaseAdmin
      .from('floors')
      .select('map_id')
      .eq('id', pin.floor_id)
      .single();

    if (!floor) {
      return NextResponse.json(
        { error: 'エリアが見つかりません' },
        { status: 404 }
      );
    }

    const { data: map } = await supabaseAdmin
      .from('maps')
      .select('user_id')
      .eq('id', floor.map_id)
      .single();

    if (!map) {
      return NextResponse.json(
        { error: 'マップが見つかりません' },
        { status: 404 }
      );
    }

    if (map.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'このピンを編集する権限がありません' },
        { status: 403 }
      );
    }

    // リクエストデータの解析
    const { title, description } = await request.json();

    // ピン情報の更新
    const { data: updatedPin, error } = await supabaseAdmin
      .from('pins')
      .update({
        title,
        description,
        updated_at: new Date().toISOString()
      })
      .eq('id', pinId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(updatedPin);
  } catch (error) {
    console.error('ピン更新エラー:', error);
    return NextResponse.json(
      { error: 'ピンの更新に失敗しました' },
      { status: 500 }
    );
  }
}

// ピンの削除
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ pinId: string }> }
) {
  const session = await auth();
  const { pinId } = await context.params;

  if (!session?.user) {
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    );
  }

  try {
    // ピンを取得してアクセス権をチェック
    const { data: pin, error: pinError } = await supabaseAdmin
      .from('pins')
      .select('id, floor_id')
      .eq('id', pinId)
      .single();

    if (pinError || !pin) {
      return NextResponse.json(
        { error: 'ピンが見つかりません' },
        { status: 404 }
      );
    }

    // 権限チェック（エリア -> マップ -> ユーザー）
    const { data: floor } = await supabaseAdmin
      .from('floors')
      .select('map_id')
      .eq('id', pin.floor_id)
      .single();

    if (!floor) {
      return NextResponse.json(
        { error: 'エリアが見つかりません' },
        { status: 404 }
      );
    }

    const { data: map } = await supabaseAdmin
      .from('maps')
      .select('user_id')
      .eq('id', floor.map_id)
      .single();

    if (!map) {
      return NextResponse.json(
        { error: 'マップが見つかりません' },
        { status: 404 }
      );
    }

    if (map.user_id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'このピンを削除する権限がありません' },
        { status: 403 }
      );
    }

    // ピンの削除
    const { error } = await supabaseAdmin
      .from('pins')
      .delete()
      .eq('id', pinId);

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { message: 'ピンが正常に削除されました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('ピン削除エラー:', error);
    return NextResponse.json(
      { error: 'ピンの削除に失敗しました' },
      { status: 500 }
    );
  }
}