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

// ピンの削除 - 改善版
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ pinId: string }> }
) {
  const session = await auth();
  const { pinId } = await context.params;

  // ログ出力（デバッグ用）
  console.log('DELETE API called for pin:', pinId);

  if (!session?.user) {
    console.log('DELETE API error: 認証が必要です');
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    );
  }

  try {
    // ピンの存在確認と情報取得
    const { data: pin, error: pinError } = await supabaseAdmin
      .from('pins')
      .select('id, floor_id')
      .eq('id', pinId)
      .single();

    if (pinError) {
      console.log('DELETE API error (pin fetch):', pinError);
      // ピンが見つからない場合は204を返す（べき等性を保つ）
      if (pinError.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'ピンはすでに削除されています' },
          { status: 204 }
        );
      }
      throw pinError;
    }

    if (!pin) {
      console.log('DELETE API error: ピンが見つかりません');
      // ピンが見つからない場合は204を返す（べき等性を保つ）
      return NextResponse.json(
        { message: 'ピンはすでに削除されています' },
        { status: 204 }
      );
    }

    // 権限チェック（エリア -> マップ -> ユーザー）
    const { data: floor, error: floorError } = await supabaseAdmin
      .from('floors')
      .select('map_id')
      .eq('id', pin.floor_id)
      .single();

    if (floorError) {
      console.log('DELETE API error (floor fetch):', floorError);
      throw floorError;
    }

    if (!floor) {
      console.log('DELETE API error: エリアが見つかりません');
      return NextResponse.json(
        { error: 'エリアが見つかりません' },
        { status: 404 }
      );
    }

    const { data: map, error: mapError } = await supabaseAdmin
      .from('maps')
      .select('user_id')
      .eq('id', floor.map_id)
      .single();

    if (mapError) {
      console.log('DELETE API error (map fetch):', mapError);
      throw mapError;
    }

    if (!map) {
      console.log('DELETE API error: マップが見つかりません');
      return NextResponse.json(
        { error: 'マップが見つかりません' },
        { status: 404 }
      );
    }

    // 所有者または管理者の場合のみ削除可能
    if (map.user_id !== session.user.id && session.user.role !== 'admin') {
      console.log('DELETE API error: 権限がありません', {
        mapUserId: map.user_id,
        sessionUserId: session.user.id,
        role: session.user.role
      });
      return NextResponse.json(
        { error: 'このピンを削除する権限がありません' },
        { status: 403 }
      );
    }

    // ピンの削除処理
    const { error: deleteError } = await supabaseAdmin
      .from('pins')
      .delete()
      .eq('id', pinId);

    if (deleteError) {
      console.log('DELETE API error (pin delete):', deleteError);
      throw deleteError;
    }

    console.log('DELETE API success for pin:', pinId);
    return NextResponse.json(
      { message: 'ピンが正常に削除されました', id: pinId },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE API unexpected error:', error);
    return NextResponse.json(
      { error: 'ピンの削除に失敗しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}