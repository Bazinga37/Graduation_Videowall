import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "node:path";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);
	app.set("trust proxy", true);
	app.useStaticAssets(join(__dirname, "..", "public"));
	const port = Number(process.env.PORT ?? 3000);
	await app.listen(port, "0.0.0.0");
	console.log(`Forma:    http://localhost:${port}/`);
	console.log(`Videozid: http://localhost:${port}/wall.html`);
}
bootstrap();
