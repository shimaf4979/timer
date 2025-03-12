// app/api/public-edit/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

// 公開編集者の登録API
export async function POST(request: NextRequest) {
  try {
    const { nickname, mapId } = await request.json();

    if (!nickname || !mapId) {
      return NextResponse.json(
        { error: 'ニックネームとマップIDは必須です' },
        { status: 400 }
      );
    }

    // マップの存在確認と公開編集可能かチェック
    const { data: map, error: mapError } = await supabaseAdmin
      .from('maps')
      .select('id, is_publicly_editable')
      .eq('map_id', mapId)
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

    // ランダムなトークンを生成
    const editorToken = crypto.randomBytes(32).toString('hex');

    // 公開編集者の登録
    const { data: editor, error: editorError } = await supabaseAdmin
      .from('public_editors')
      .insert([
        {
          map_id: map.id,
          nickname,
          editor_token: editorToken
        }
      ])
      .select()
      .single();

    if (editorError) {
      throw editorError;
    }

    return NextResponse.json({
      editorId: editor.id,
      nickname: editor.nickname,
      token: editorToken
    });
  } catch (error) {
    console.error('公開編集者登録エラー:', error);
    return NextResponse.json(
      { error: '登録に失敗しました' },
      { status: 500 }
    );
  }
}
