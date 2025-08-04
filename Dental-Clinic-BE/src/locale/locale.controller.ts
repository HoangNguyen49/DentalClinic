import { Controller, Get, Req, Res, Query } from '@nestjs/common';
import { Response, Request } from 'express';

@Controller('locale')
export class LocaleController {
  @Get()
  setLanguage(@Query('lang') lang: string, @Res() res: Response, @Req() req: Request) {
    res.cookie('lang', lang, { maxAge: 900000, httpOnly: false });
    return res.send({ message: req.t('locale.changed'), lang });
  }
}
