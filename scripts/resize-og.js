import fs from "fs";
import path from "path";
import sharp from "sharp";

const BASE = path.join(
  process.cwd(),
  "public",
  "content",
  "properties"
);

async function run() {
  const folders = fs.readdirSync(BASE);

  for (const folder of folders) {
    const imgPath = path.join(BASE, folder, "fotos", "1.jpg");

    if (!fs.existsSync(imgPath)) continue;

    try {
      const image = sharp(imgPath);
      const meta = await image.metadata();

      // se já estiver dentro do limite, pula
      if (
        meta.width <= 1200 &&
        meta.height <= 630
      ) {
        console.log(`✔️ ${folder} já ok`);
        continue;
      }

      await image
        .resize({
          width: 1200,
          height: 630,
          fit: "inside", // mantém proporção
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toFile(imgPath + ".tmp");

      fs.renameSync(imgPath + ".tmp", imgPath);

      console.log(`🖼️ Redimensionado: ${folder}`);
    } catch (err) {
      console.error(`❌ Erro em ${folder}`, err);
    }
  }

  console.log("✅ Finalizado");
}

run();
