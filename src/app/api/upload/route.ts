import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate a unique filename
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const fileName = `${session.user.id}-${timestamp}.${fileExt}`;

    // Store in supplier-offers bucket with organized path
    const filePath = `supplier-offers/${session.user.id}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('supplier-offers')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading file:', error);
      return NextResponse.json(
        { error: 'Error uploading file' },
        { status: 500 }
      );
    }

    // Get the public URL
    const {
      data: { publicUrl }
    } = supabase.storage.from('supplier-offers').getPublicUrl(data.path);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
