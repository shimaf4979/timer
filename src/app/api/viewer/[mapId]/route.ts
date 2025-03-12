// app/api/viewer/[mapId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Pin } from '@/types/map-types';

// マップ情報の取得 (認証不要・公開)
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ mapId: string }> }
) {
  try {
    const { mapId } = await context.params;
    
    // マップ情報を取得
    const { data: map, error: mapError } = await supabaseAdmin
      .from('maps')
      .select('id, map_id, title, description, is_publicly_editable')
      .eq('map_id', mapId)
      .single();

    if (mapError || !map) {
      return NextResponse.json(
        { error: 'マップが見つかりません' },
        { status: 404 }
      );
    }

    // エリア情報を取得
    const { data: floors, error: floorsError } = await supabaseAdmin
      .from('floors')
      .select('id, map_id, floor_number, name, image_url')
      .eq('map_id', map.id)
      .order('floor_number', { ascending: true });

    if (floorsError) {
      return NextResponse.json(
        { error: 'エリアの取得に失敗しました' },
        { status: 500 }
      );
    }

    // 全てのピン情報を取得
    let pins: Pin[] = [];
    if (floors && floors.length > 0) {
      const floorIds = floors.map(floor => floor.id);
      const { data: pinsData, error: pinsError } = await supabaseAdmin
        .from('pins')
        .select('id, floor_id, title, description, x_position, y_position')
        .in('floor_id', floorIds);

      if (!pinsError) {
        pins = pinsData;
      }
    }

    // マップ、エリア、ピンの情報をまとめて返す
    return NextResponse.json({
      map,
      floors,
      pins
    });
  } catch (error) {
    console.error('データ取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}