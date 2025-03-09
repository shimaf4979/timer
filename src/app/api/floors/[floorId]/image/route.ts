// app/api/floors/[floorId]/image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

export async function POST(
  request: NextRequest,
  context: { params: { floorId: string } }
) {
  const session = await auth();
  const { floorId } = await context.params;
  
  if (!session?.user) {
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    );
  }

  try {
    // フォームデータから画像を取得
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: '画像ファイルが必要です' },
        { status: 400 }
      );
    }

    // エリアが存在し、現在のユーザーが所有しているか確認
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

    // マップの所有者を確認
    const { data: map, error: mapError } = await supabaseAdmin
      .from('maps')
      .select('user_id, map_id')
      .eq('id', floor.map_id)
      .single();

    if (mapError || !map) {
      return NextResponse.json(
        { error: 'マップが見つかりません' },
        { status: 404 }
      );
    }

    if (map.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'このマップを編集する権限がありません' },
        { status: 403 }
      );
    }

    // ファイル名の生成
    const fileExtension = file.name.split('.').pop();
    const fileName = `${map.map_id}/${floorId}_${Date.now()}.${fileExtension}`;

    // ファイルをバイナリとして読み込む
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Supabase Storageにアップロード
    const { error: uploadError } = await supabaseAdmin
      .storage
      .from('floor_images')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    // 公開URLを取得
    const { data: urlData } = supabaseAdmin
      .storage
      .from('floor_images')
      .getPublicUrl(fileName);

    // エリアデータを更新
    const { data: updatedFloor, error: updateError } = await supabaseAdmin
      .from('floors')
      .update({
        image_url: urlData.publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', floorId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(updatedFloor);
  } catch (error) {
    console.error('画像アップロードエラー:', error);
    return NextResponse.json(
      { error: '画像のアップロードに失敗しました' },
      { status: 500 }
    );
  }
}