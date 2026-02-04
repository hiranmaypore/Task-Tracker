
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';

import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password_hash))) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }

  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    await this.mailService.sendWelcomeEmail(user.email, user.name);
    return user;
  }

  async googleLogin(reqUser: any) {
    if (!reqUser) return 'No user from google';
    
    let user: any = await this.usersService.findByEmail(reqUser.email);
    
    if (!user) {
        const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        user = await this.usersService.create({
            email: reqUser.email,
            name: `${reqUser.firstName} ${reqUser.lastName}`,
            password: randomPassword,
            role: 'USER'
        });
        await this.mailService.sendWelcomeEmail(user.email, user.name);
    }
    
    // Update Google Tokens
    await this.usersService.update(user.id, {
        googleAccessToken: reqUser.accessToken,
        googleRefreshToken: reqUser.refreshToken,
        calendarSyncEnabled: true // Enable by default on login/signup
    });
    
    // Refresh user object to get latest fields if needed
    user = await this.usersService.findOne(user.id);
    
    // Login logic
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: reqUser.picture
      }
    };
  }
}
