import QRCode from "qrcode";
import fs from "fs";

const url = "https://copy-pay.vercel.app/s/seller1/";

const out = "qr-seller1.png";
const png = await QRCode.toBuffer(url, {
  type: "png",
  width: 512,
  margin: 2,
  errorCorrectionLevel: "M",
});

fs.writeFileSync(out, png);
console.log("saved:", out);
