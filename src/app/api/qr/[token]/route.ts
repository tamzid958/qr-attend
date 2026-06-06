import { NextResponse } from "next/server"
import QRCode from "qrcode"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const buffer = await QRCode.toBuffer(`attendance://${token}`, {
    errorCorrectionLevel: "H",
    width: 400,
    margin: 2,
  })
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
