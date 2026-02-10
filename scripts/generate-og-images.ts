import fs from "fs";
import path from "path";
import sharp from "sharp";

const basePath = path.join(process.cwd(), "public/content/properties");

const folders = fs.readdirSync(basePath);

(async () => {
  for (const folder of folders) {
    const input = path.join(basePath, folder, "fotos", "1.jpg");
    const output = path.join(basePath, folder, "og.jpg");

    if (!fs.existsSync(input)) continue;

    await sharp(input)
      .resize(1200, 630, {
        fit: "cover",
        position: "centre",
      })
      .jpeg({
        quality: 82,
        progressive: false,
      })
      .toFile(output);

    console.log(`✔ OG gerada: ${folder}`);
  }
})();
