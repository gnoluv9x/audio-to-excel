import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // defaults to auto

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Đọc nội dung file
    const fileBuffer = await file.arrayBuffer();

    const fileBase64 = Buffer.from(fileBuffer).toString('base64');

    const resp = await fetch('https://api.nlpcloud.io/v1/gpu/whisper/asr', {
      method: 'POST',
      headers: {
        Authorization: `Token ${process.env.NLP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        encoded_file: fileBase64,
        input_language: 'vi',
      }),
    }).then((res) => res.json());

    return NextResponse.json(
      {
        text: resp?.text || '',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json({ error: 'Error processing file' }, { status: 500 });
  }
}
