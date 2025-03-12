
// app/api/public-edit/pins/[pinId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// 公開編集でピンを更新
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ pinId: string }> }
) {
  try {
    const { pinId } = await context.params;
    const { title, description, editorId } = await request.json();

    if (!title || !editorId) {
      return NextResponse.json(
        { error: 'タイトルと編集者IDは必須です' },
        { status: 400 }
      );
    }

    // ピンの存在確認
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

    // フロアの存在確認
    const { data: floor, error: floorError } = await supabaseAdmin
      .from('floors')
      .select('map_id')
      .eq('id', pin.floor_id)
      .single();

    if (floorError || !floor) {
      return NextResponse.json(
        { error: 'エリアが見つかりません' },
        { status: 404 }
      );
    }

    // マップが公開編集可能か確認
    const { data: map, error: mapError } = await supabaseAdmin
      .from('maps')
      .select('is_publicly_editable')
      .eq('id', floor.map_id)
      .single();

    if (mapError || !map) {
      return NextResponse.json(
        { error: 'マップが見つかりません' },
        { status: 404 }
      );
    }

    if (!map.is_publicly_editable) {
      return NextResponse.json(
        { error: 'このマップは公開編集が許可されていません' },
        { status: 403 }
      );
    }

    // 編集者の検証
    const { data: editor, error: editorError } = await supabaseAdmin
      .from('public_editors')
      .select('id, nickname')
      .eq('id', editorId)
      .eq('map_id', floor.map_id)
      .single();

    if (editorError || !editor) {
      return NextResponse.json(
        { error: '編集権限がありません' },
        { status: 401 }
      );
    }

    // ピンの更新
    const { data: updatedPin, error } = await supabaseAdmin
      .from('pins')
      .update({
        title,
        description,
        editor_id: editorId,
        editor_nickname: editor.nickname,
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
    console.error('公開編集ピンの更新エラー:', error);
    return NextResponse.json(
      { error: 'ピンの更新に失敗しました' },
      { status: 500 }
    );
  }
}

// 公開編集でピンを削除
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ pinId: string }> }
) {
  try {
    const { pinId } = await context.params;
    const url = new URL(request.url);
    const editorId = url.searchParams.get('editorId');

    if (!editorId) {
      return NextResponse.json(
        { error: '編集者IDは必須です' },
        { status: 400 }
      );
    }

    // ピンの存在確認
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

    // フロアの存在確認
    const { data: floor, error: floorError } = await supabaseAdmin
      .from('floors')
      .select('map_id')
      .eq('id', pin.floor_id)
      .single();

    if (floorError || !floor) {
      return NextResponse.json(
        { error: 'エリアが見つかりません' },
        { status: 404 }
      );
    }

    // マップが公開編集可能か確認
    const { data: map, error: mapError } = await supabaseAdmin
      .from('maps')
      .select('is_publicly_editable')
      .eq('id', floor.map_id)
      .single();

    if (mapError || !map) {
      return NextResponse.json(
        { error: 'マップが見つかりません' },
        { status: 404 }
      );
    }

    if (!map.is_publicly_editable) {
      return NextResponse.json(
        { error: 'このマップは公開編集が許可されていません' },
        { status: 403 }
      );
    }

    // 編集者の検証
    const { data: editor, error: editorError } = await supabaseAdmin
      .from('public_editors')
      .select('id')
      .eq('id', editorId)
      .eq('map_id', floor.map_id)
      .single();

    if (editorError || !editor) {
      return NextResponse.json(
        { error: '編集権限がありません' },
        { status: 401 }
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
      { message: 'ピンが正常に削除されました', id: pinId },
      { status: 200 }
    );
  } catch (error) {
    console.error('公開編集ピンの削除エラー:', error);
    return NextResponse.json(
      { error: 'ピンの削除に失敗しました' },
      { status: 500 }
    );
  }
}