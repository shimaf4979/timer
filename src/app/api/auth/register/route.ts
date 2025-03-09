// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // 入力検証
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: '必須フィールドが入力されていません' },
        { status: 400 }
      );
    }

    // Emailが既に登録されているかチェック
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      );
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // ユーザー登録
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert([
        {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: 'user' // デフォルトロール
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Registration error:', error);
      return NextResponse.json(
        { error: 'ユーザー登録に失敗しました' },
        { status: 500 }
      );
    }

    // 成功レスポンス
    return NextResponse.json(
      { 
        message: 'ユーザーが正常に登録されました',
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}