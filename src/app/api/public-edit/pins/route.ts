
// app/api/public-edit/pins/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// 公開編集でピンを追加
export async function POST(request: NextRequest) {
  try {
    const { floorId, title, description, x_position, y_position, editorId, nickname } = await request.json();

    if (!floorId || !title || x_position === undefined || y_position === undefined || !editorId || !nickname) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    // フロアの存在確認と公開編集可能かチェック
    const { data: floor, error: floorError } = await supabaseAdmin
      .from('floors')
      .select('id, map_id')
      .eq('id', floorId)
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

    // ピンの作成
    const { data: pin, error } = await supabaseAdmin
      .from('pins')
      .insert([
        {
          floor_id: floorId,
          title,
          description,
          x_position,
          y_position,
          editor_id: editorId,
          editor_nickname: nickname
        }
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(pin, { status: 201 });
  } catch (error) {
    console.error('公開編集ピンの作成エラー:', error);
    return NextResponse.json(
      { error: 'ピンの作成に失敗しました' },
      { status: 500 }
    );
  }
}
