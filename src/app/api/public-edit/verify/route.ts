
// app/api/public-edit/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// 公開編集者の検証API
export async function POST(request: NextRequest) {
  try {
    const { editorId, token } = await request.json();

    if (!editorId || !token) {
      return NextResponse.json(
        { error: '編集者IDとトークンは必須です' },
        { status: 400 }
      );
    }

    // トークンが正しいか検証
    const { data: editor, error } = await supabaseAdmin
      .from('public_editors')
      .select('id, nickname, map_id')
      .eq('id', editorId)
      .eq('editor_token', token)
      .single();

    if (error || !editor) {
      return NextResponse.json(
        { error: '無効なトークンです' },
        { status: 401 }
      );
    }

    // 最終アクティブ時間を更新
    await supabaseAdmin
      .from('public_editors')
      .update({ last_active: new Date().toISOString() })
      .eq('id', editorId);

    return NextResponse.json({
      verified: true,
      editorId: editor.id,
      nickname: editor.nickname,
      mapId: editor.map_id
    });
  } catch (error) {
    console.error('公開編集者検証エラー:', error);
    return NextResponse.json(
      { error: '検証に失敗しました' },
      { status: 500 }
    );
  }
}
