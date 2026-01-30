import QRCode from "qrcode";
import fs from "fs";

const url = "https://copy-pay.vercel.app/s/seller4/";

const out = "qr-냐호.png";
const png = await QRCode.toBuffer(url, {
  type: "png",
  width: 512,
  margin: 2,
  errorCorrectionLevel: "M",
});

fs.writeFileSync(out, png);
console.log("saved:", out);
