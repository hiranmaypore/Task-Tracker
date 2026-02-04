import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() signInDto: Record<string, any>) {
    const user = await this.authService.validateUser(signInDto.email, signInDto.password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.authService.login(user);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const data = await this.authService.googleLogin(req.user);
    // Redirect to frontend with token
    // In production, better to use a secure cookie or postMessage
    // For now, passing token in query param
    if (data && typeof data !== 'string') {
        const token = data.access_token;
        const user = encodeURIComponent(JSON.stringify(data.user));
        return res.redirect(`http://localhost:5173/login?token=${token}&user=${user}`);
    } else {
        return res.redirect('http://localhost:5173/login?error=auth_failed');
    }
  }
}
