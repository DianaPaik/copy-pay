import QRCode from "qrcode";
import fs from "fs";

const url = "https://copy-pay.vercel.app/s/seller5/";

const out = "qr-seller5.png";
const png = await QRCode.toBuffer(url, {
  type: "png",
  width: 512,
  margin: 2,
  errorCorrectionLevel: "M",
});

fs.writeFileSync(out, png);
console.log("saved:", out);
