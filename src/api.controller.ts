import { Body, Controller, Get, HttpException, Ip, NotFoundException, Param, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import * as QRCode from 'qrcode';
import { StudentRepository } from './students.repository';
import { DisplayService } from './display.service';

const RATE_WINDOW_MS = 60000;
const RATE_MAX = 5; // max pokušaja po IP-u u minuti (sprječava pogađanje JMBAG-ova)

@Controller('api')
export class ApiController {
  private hits = new Map<string, number[]>();

  constructor(private students: StudentRepository, private display: DisplayService) {}

  @Post('submit')
  async submit(@Body() body: { jmbag?: string }, @Ip() ip: string) {
    this.rateLimit(ip);
    const jmbag = String(body?.jmbag ?? '').replace(/\s/g, '');
    if (!/^\d{10}$/.test(jmbag)) throw new HttpException('JMBAG mora imati točno 10 znamenki.', 400);

    const student = await this.students.findByJmbag(jmbag);
    if (!student) throw new HttpException('JMBAG nije na popisu za ovu promociju.', 404);

    const res = this.display.enqueue(student);
    if (!res.ok) throw new HttpException(res.reason, 409);
    return { ime: student.ime, position: res.position };
  }

  /** Slika ide preko nasumičnog ID-a slajda, tako da se JMBAG nikad ne pojavi na zidu ni u URL-u. */
  @Get('slide/:id/photo')
  async photo(@Param('id') id: string, @Res() res: Response) {
    const jmbag = this.display.jmbagForSlide(id);
    if (!jmbag) throw new NotFoundException();
    const photo = await this.students.findPhoto(jmbag);
    if (!photo) throw new NotFoundException();
    if (photo.kind === 'url') return res.redirect(302, photo.url);
    res.type(photo.mime).set('Cache-Control', 'no-store').send(photo.data);
  }

  /** QR koji vodi na formu. PUBLIC_URL postavi na javnu adresu (npr. https://promocija.fer.hr/). */
  @Get('qr.svg')
  async qr(@Req() req: Request, @Res() res: Response) {
    const url = process.env.PUBLIC_URL ?? `${req.protocol}://${req.get('host')}/`;
    const svg = await QRCode.toString(url, { type: 'svg', margin: 1 });
    res.type('image/svg+xml').send(svg);
  }

  private rateLimit(ip: string) {
    const now = Date.now();
    const list = (this.hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
    if (list.length >= RATE_MAX) throw new HttpException('Previše pokušaja, pričekaj minutu.', 429);
    list.push(now);
    this.hits.set(ip, list);
  }
}
